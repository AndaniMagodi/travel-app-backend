require('dotenv').config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "booking-com15.p.rapidapi.com";

// NOTE: path below is a placeholder — confirm against the real RapidAPI
// code snippet before relying on this. Reviews are deliberately NOT
// fetched here — a sample response returned what looked like stale/cached
// data unrelated to the searched city, so reviews were scoped out to avoid
// shipping unreliable data this close to the demo.

async function resolveLocation(query) {
  const url = `https://${RAPIDAPI_HOST}/api/v1/attraction/searchLocation?query=${encodeURIComponent(query)}&languagecode=en-us`;

  const response = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Attraction location lookup failed:", response.status, body);
    throw new Error(`Attraction location lookup failed for "${query}" (status ${response.status})`);
  }

  const data = await response.json();
  const destinations = data.data?.destinations;
  if (!destinations || destinations.length === 0) {
    throw new Error(`No attraction location found for "${query}"`);
  }

  return { id: destinations[0].id };
}

async function search({ id }) {
  const url = `https://${RAPIDAPI_HOST}/api/v1/attraction/searchAttractions?id=${encodeURIComponent(id)}&sortBy=trending&page=1&currency_code=ZAR&languagecode=en-us`;

  const response = await fetch(url, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Attraction search failed:", response.status, body);
    throw new Error(`Attraction search request failed (status ${response.status})`);
  }

  return response.json();
}

module.exports = { resolveLocation, search };