# Travel Planner — Backend

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

A single endpoint, `/api/trip`, runs four providers concurrently:

- `providers/weather.js` — Open-Meteo (free, no key required)
- `providers/hotels.js` — Booking.com via RapidAPI
- `providers/flights.js` — Booking.com via RapidAPI
- `providers/carRental.js` — Sky-Scrapper via RapidAPI

Each provider exports the same two-function interface — `resolveLocation(query)`
and `search(location, params)` — so `orchestrator.js` can drive all four
through identical generic logic without knowing which provider it's calling.

Each provider task is wrapped individually so a failure in one (e.g. a
captcha block or rate limit) never blocks or crashes the other three —
the response always returns whatever succeeded, with per-category
`status: 'ok' | 'error'`.

## Persistence (MongoDB)

Every search is saved via Mongoose (`models/SearchHistory.js`), including
the full result payload across all four categories. This powers:

- `GET /api/history` — recent searches (city + dates only, no results) for
  a "Recent Searches" UI
- `GET /api/history/:id` — the full saved result for one past search, used
  to instantly reload a previous search with zero new API calls

The save happens "fire and forget" after the response is already built —
a MongoDB failure never blocks or delays the `/api/trip` response itself,
it's only logged.

## Known limitations

- Car rental real-API integration (Sky-Scrapper) is occasionally blocked by
  the provider's own bot protection (PerimeterX) — confirmed via direct
  testing on RapidAPI's own console, not specific to this code.
- No request caching beyond MongoDB history — a repeat search with
  identical params still calls all four providers fresh.
