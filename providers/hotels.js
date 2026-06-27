require('dotenv').config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOTELS_HOST = "booking-com15.p.rapidapi.com";

async function resolveLocation(query) {
  const url = `https://${RAPIDAPI_HOTELS_HOST}/api/v1/hotels/searchDestination?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOTELS_HOST,
    },
  });

  if (!response.ok) {
    throw new Error(`Hotel location lookup failed for "${query}"`);
  }

  const data = await response.json();

  // The API returns multiple match types (city, landmark, hotel, golf course, etc.)
  // We only want city-level matches for "search a destination city" behaviour.
  const cityMatch = (data.data || []).find((entry) => entry.dest_type === "city");

  if (!cityMatch) {
    throw new Error(`No city match found for "${query}"`);
  }

  return { destId: cityMatch.dest_id, name: cityMatch.name };
}

async function search({ destId }, { checkIn, checkOut, adults = 1 }) {
  const url =
    `https://${RAPIDAPI_HOTELS_HOST}/api/v1/hotels/searchHotels` +
    `?dest_id=${encodeURIComponent(destId)}` +
    `&search_type=CITY` +
    `&arrival_date=${checkIn}` +
    `&departure_date=${checkOut}` +
    `&adults=${adults}`;

  const response = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOTELS_HOST,
    },
  });

  if (!response.ok) {
    throw new Error("Hotel search request failed");
  }

  return response.json();
}

module.exports = { resolveLocation, search };