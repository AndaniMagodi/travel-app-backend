// providers/exchangeRate.js
//
// Uses Frankfurter (api.frankfurter.dev) — free, no API key, sourced from
// the ECB. Used to convert hotel prices (which Booking.com returns in USD
// regardless of the property's local currency) into ZAR for display
// consistency with flights and car rentals.

let cachedRate = null;
let cachedAt = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour — rates don't move fast enough to need fresher data per-request

async function getUsdToZarRate() {
  const now = Date.now();
  if (cachedRate && cachedAt && now - cachedAt < CACHE_DURATION_MS) {
    return cachedRate;
  }

  const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=ZAR");
  if (!response.ok) {
    throw new Error("Exchange rate request failed");
  }

  const data = await response.json();
  cachedRate = data.rates.ZAR;
  cachedAt = now;
  return cachedRate;
}

module.exports = { getUsdToZarRate };