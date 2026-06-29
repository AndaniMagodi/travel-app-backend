# Travel Planner — Frontend

Vue 3 single-page app for the Travel Planner. Takes a destination city and
travel dates, and renders weather, hotels, flights, car rentals, and
attractions for that trip in one consolidated view.

## Setup

Install dependencies:

    npm install

Create a `.env` file in this folder with:

    VITE_API_URL=http://localhost:4000

Run the dev server:

    npm run dev

The backend (see the sibling `travel-app-backend` repo) must be running
separately for searches to return real data.

## Structure

- TripSearch.vue — the search form (city, check-in, check-out)
- SearchHistory.vue — recent searches, reloads a past result instantly from
  the backend's saved history with zero new API calls
- SkeletonLoader.vue — loading state shown while a live search is in flight
- TripSummary.vue — estimated trip cost, built from the cheapest item in
  each category already present in the response (no extra API calls)
- WeatherCard.vue, HotelCard.vue, FlightCard.vue, CarRentalCard.vue,
  AttractionCard.vue — one component per result category
- HotelMap.vue — Leaflet/OpenStreetMap view of hotel locations, embedded
  inside HotelCard

## Design notes

Hotel, flight, and attraction "Book" links point to each provider's public
search results page (Booking.com), pre-filled with the relevant city/dates —
not a deep link to the exact priced offer, since that requires a more
involved booking-flow integration the providers don't expose simply. Car
rental is the exception: Expedia's API returns a real per-offer booking URL,
so those links go straight to the specific listed car.

Flight, hotel, and car rental cards share the same filter/sort/pagination
pattern (a left-hand filter sidebar, a sort or filter checklist derived from
the actual results already in memory, and a "Show more results" button) —
deliberately reused across all three rather than three different
implementations.

## Known limitations

- No cross-highlighting between the hotel map and hotel cards yet (clicking
  a card doesn't highlight its map pin, or vice versa) — a natural next
  step, not built due to time constraints.
- The trip cost summary estimates from the *cheapest* item per category,
  not a specific selected itinerary — clearly labeled as an estimate in the UI.

## Persistence (MongoDB)

Every search is saved to MongoDB via Mongoose (`models/SearchHistory.js`),
including the full result payload for all five categories. This powers two
things:

- `/api/history` — a lightweight list of the most recent searches (city +
  dates only, results excluded) for the "Recent Searches" UI
- `/api/history/:id` — the full saved result for one past search, used to
  instantly reload a previous search with zero new API calls — useful both
  for the user revisiting a trip, and for safely demoing without spending
  RapidAPI quota on repeat searches

The save happens "fire and forget" after the response is already prepared —
a MongoDB failure never blocks or delays the actual `/api/trip` response,
it's only logged.
