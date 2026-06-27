require('dotenv').config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_FLIGHTS_HOST = "booking-com15.p.rapidapi.com";

async function resolveLocation(query) {
  const url = `https://${RAPIDAPI_FLIGHTS_HOST}/api/v1/flights/searchDestination?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_FLIGHTS_HOST,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Flight location lookup failed:", response.status, body);
    throw new Error(`Flight location lookup failed for "${query}" (status ${response.status})`);
  }

  const data = await response.json();

  if (!data.data || data.data.length === 0) {
    throw new Error(`No flight location found for "${query}"`);
  }

  // id comes back like "JNB.CITY" or "JNB.AIRPORT" — take the first match
  return { id: data.data[0].id, name: data.data[0].name };
}

async function search({ id }, { fromCity, departDate, adults = 1 }) {
  // Flights need TWO resolved location IDs, not one — origin and destination.
  // `id` here is the destination (resolved already, before search() is called).
  // `fromCity` is a raw city name string (e.g. "Johannesburg"), so it needs
  // to go through the same resolveLocation lookup before it's usable.
  const origin = await resolveLocation(fromCity);

  const url =
    `https://${RAPIDAPI_FLIGHTS_HOST}/api/v1/flights/searchFlights` +
    `?fromId=${encodeURIComponent(origin.id)}` +
    `&toId=${encodeURIComponent(id)}` +
    `&departDate=${departDate}` +
    `&adults=${adults}` +
    `&stops=none` +
    `&pageNo=1` +
    `&sort=BEST` +
    `&cabinClass=ECONOMY` +
    `&currency_code=ZAR`;

  //console.log("Flight search URL:", url);

  const response = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_FLIGHTS_HOST,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Flight search failed:", response.status, body);
    throw new Error(`Flight search request failed (status ${response.status})`);
  }

  return response.json();
}

module.exports = { resolveLocation, search };