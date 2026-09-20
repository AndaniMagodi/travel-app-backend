# Travel Planner — Backend

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open%20App-00C7B7?logo=vercel&logoColor=white)](https://travel-app-frontend-beryl.vercel.app/)

[Live demo](https://travel-app-frontend-beryl.vercel.app/) · [Frontend repository](https://github.com/AndaniMagodi/travel-app-frontend)

Express API that aggregates weather, hotel, flight, and car rental data from
multiple third-party providers for a given destination city and travel
dates, and persists every search to MongoDB.

## Setup

Install dependencies:

    npm install

Create a `.env` file in this folder with:

    RAPIDAPI_KEY=your_rapidapi_key
    PORT=4000
    MONGODB_URI=your_mongodb_atlas_connection_string

Run the server:

    node server.js

The frontend (see the sibling `travel-app-frontend` repo) expects this
running on `http://localhost:4000`.

## Architecture

A single endpoint, `/api/trip`, runs five providers concurrently:

- `providers/weather.js` — Open-Meteo (free, no key required)
- `providers/hotels.js` — Booking.com via RapidAPI
- `providers/flights.js` — Booking.com via RapidAPI
- `providers/attractions.js` — Booking.com attractions via RapidAPI
- `providers/carRentalExpedia.js` — Expedia via RapidAPI

Each provider exports the same two-function interface — `resolveLocation(query)`
and `search(location, params)` — so `orchestrator.js` can drive all five
through identical generic logic without knowing which provider it's calling.

Each provider task is wrapped individually so a failure in one (e.g. a
captcha block or rate limit) never blocks or crashes the others — the
response always returns whatever succeeded, with per-category
`status: 'ok' | 'error'`.

One thing runs *before* the five and is not a provider in the above sense:
`providers/exchangeRate.js` fetches the live USD→ZAR rate first, because
car rental needs it server-side to convert prices, and hotels need it in
the frontend. It is awaited up front rather than run in parallel, and its
value comes back on the response as `exchangeRate.usdToZar`. A failure here
is logged and leaves the rate `null` rather than failing the request.

## Persistence (MongoDB)

Every search is saved via Mongoose (`models/SearchHistory.js`), including
the full result payload across all five categories. This powers:

- `GET /api/history` — recent searches (city + dates only, no results) for
  a "Recent Searches" UI
- `GET /api/history/:id` — the full saved result for one past search, used
  to instantly reload a previous search with zero new API calls

The save happens "fire and forget" after the response is already built —
a MongoDB failure never blocks or delays the `/api/trip` response itself,
it's only logged.

## Known limitations

- No request caching beyond MongoDB history — a repeat search with
  identical params still calls all five providers fresh.
- Car rental went through two earlier providers before Expedia. Booking.com's
  car endpoint returned persistent server errors, and a Sky-Scrapper attempt
  was blocked by the provider's own bot protection (PerimeterX) — both
  confirmed via direct testing in RapidAPI's console, neither specific to
  this code. Expedia is the one that worked and is what ships; the earlier
  mock provider has been removed.
- `/api/trip` accepts a `fromCity` query param for the flight origin, but it
  defaults to Johannesburg and the frontend never sends it, so flight results
  always depart from a Johannesburg-area airport (JNB or HLA).
