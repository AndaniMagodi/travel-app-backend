
async function resolveLocation(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}`;
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`Geocoding lookup failed for "${query}"`);
    }
  
    const data = await response.json();
  
    if (!data.results || data.results.length === 0) {
      throw new Error(`No location found for "${query}"`);
    }
  
    const best = data.results[0];
    return { latitude: best.latitude, longitude: best.longitude, name: best.name };
  }
  
  async function search({ latitude, longitude }, { days = 7 } = {}) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=${days}`;
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error("Weather forecast request failed");
    }
  
    return response.json();
  }
  
  module.exports = { resolveLocation, search };