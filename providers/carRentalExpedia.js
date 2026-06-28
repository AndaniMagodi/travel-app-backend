// providers/carRentalExpedia.js
//
// Real Expedia car rental data via RapidAPI — built as a parallel option
// alongside the existing carRental.js mock, NOT a replacement yet. Confirmed
// working via a direct test in RapidAPI's console before writing this.
//
// Response is GraphQL-shaped and deeply nested. The actual listings live at
// data.carSearchOrRecommendations.carSearchResults.carSearchListings — a
// mixed array of sponsored placements (__typename: "SponsoredContentPlacement")
// and real offers (__typename: "CarOfferCard"). Sponsored entries are filtered
// out below since they carry no vehicle/price data.

require("dotenv").config();

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const EXPEDIA_HOST = "expedia15.p.rapidapi.com";

async function resolveLocation(query) {
  const url = `https://${EXPEDIA_HOST}/car/auto-complete?query=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": EXPEDIA_HOST,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Expedia location lookup failed:", response.status, body);
    throw new Error(`Location lookup failed for "${query}"`);
  }

  const data = await response.json();
  const matches = data?.data?.sr;
  if (!matches || matches.length === 0) {
    throw new Error(`No location found for "${query}"`);
  }

  // Prefer an AIRPORT match if one exists — car rentals are most commonly
  // picked up/dropped off at airports, and the gaiaId here matches the
  // regionId format Expedia's car search endpoint expects.
  const airportMatch = matches.find((m) => m.type === "AIRPORT");
  const best = airportMatch ?? matches[0];

  return {
    locationId: best.gaiaId,
    name: best.regionNames?.primaryDisplayName ?? query,
  };
}

async function search({ locationId }, { pickUpDate, dropOffDate, pickUpTime = "09:00", dropOffTime = "17:00", usdToZarRate = null }) {
  const url =
    `https://${EXPEDIA_HOST}/car/search` +
    `?pickUpLocation=${encodeURIComponent(locationId)}` +
    `&pickUpDate=${pickUpDate}` +
    `&pickUpTime=${encodeURIComponent(pickUpTime)}` +
    `&dropOffLocation=${encodeURIComponent(locationId)}` +
    `&dropOffDate=${dropOffDate}` +
    `&dropOffTime=${encodeURIComponent(dropOffTime)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": EXPEDIA_HOST,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Expedia car search failed:", response.status, body);
    throw new Error(`Car search request failed (status ${response.status})`);
  }

  const raw = await response.json();

  const listings = raw?.data?.carSearchOrRecommendations?.carSearchResults?.carSearchListings || [];

  // formattedValue comes back as a string like "$35" — strip the currency
  // symbol and parse to a real number so the rest of the app (sorting, the
  // cost summary) can use it the same way as every other category.
  function parsePrice(formattedValue) {
    if (!formattedValue) return null;
    const numeric = parseFloat(formattedValue.replace(/[^0-9.]/g, ""));
    if (isNaN(numeric)) return null;
    return usdToZarRate ? numeric * usdToZarRate : numeric;
  }

  const currency = usdToZarRate ? "ZAR" : "USD";

  const cars = listings
    .filter((item) => item.__typename === "CarOfferCard")
    .map((item) => ({
      id: item.detailsContext?.carOfferToken ?? item.tripsSaveItemWrapper?.tripsSaveItem?.itemId,
      make: item.vehicle?.description ?? item.vehicle?.category ?? "Vehicle",
      model: "",
      type: item.vehicle?.category ?? "Car",
      pricePerDay: parsePrice(item.priceSummary?.lead?.formattedValue),
      priceTotal: parsePrice(item.priceSummary?.total?.formattedValue),
      currency,
      vendor: item.vendor?.image?.description ?? "Unknown",
      vendorLogo: item.vendor?.image?.url ?? null,
      image: item.vehicle?.image?.url ?? null,
      seats: item.vehicle?.attributes?.find((a) => a.icon?.id === "person")?.text ?? null,
      transmission: item.vehicle?.attributes?.find((a) => a.icon?.id === "transmission")?.text ?? null,
      rating: item.review?.rating ?? null,
      freeCancellation: (item.actionableConfidenceMessages || []).some(
        (m) => m.value === "Free cancellation" || m.text === "Free cancellation"
      ),
      bookingUrl: item.infositeURL?.value ?? null,
    }));

  return { cars };
}

module.exports = { resolveLocation, search };