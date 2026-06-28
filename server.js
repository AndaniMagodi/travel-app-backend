require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./db");
const SearchHistory = require("./models/SearchHistory");
const { getResults } = require("./orchestrator");
const weatherProvider = require("./providers/weather");
const hotelProvider = require("./providers/hotels");
const flightProvider = require("./providers/flights");
const carRentalProvider = require("./providers/carRentalExpedia");
const { getUsdToZarRate } = require("./providers/exchangeRate");
const attractionProvider = require("./providers/attractions");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

// One endpoint that runs all five providers in parallel and returns
// whatever succeeded — a failure in one category doesn't block the others.
app.get("/api/trip", async (req, res) => {
  const { city, checkIn, checkOut, fromCity = "Johannesburg" } = req.query;

  if (!city || !checkIn || !checkOut) {
    return res
      .status(400)
      .json({ error: "city, checkIn, and checkOut are required" });
  }

  // Each task gets its own .catch() attached immediately, at creation time —
  // not later in a loop. If a promise rejects before anything is "watching"
  // it, Node treats it as an unhandled rejection and can crash the process,
  // even if you technically await it inside a try/catch further down.
  const toSafeResult = (promise) =>
    promise
      .then((data) => ({ status: "ok", data }))
      .catch((err) => ({ status: "error", error: err.message }));

  // Fetch the exchange rate FIRST — both hotels (in the frontend) and car
  // rental (here, server-side) need it to convert USD prices to ZAR, so it
  // has to be available before those tasks run, not after.
  let usdToZarRate = null;
  try {
    usdToZarRate = await getUsdToZarRate();
  } catch (err) {
    console.error("Exchange rate fetch failed:", err.message);
  }

  const tasks = {
    weather: toSafeResult(getResults(city, { days: 7 }, weatherProvider)),
    attractions: toSafeResult(getResults(city, {}, attractionProvider)),
    hotels: toSafeResult(
      getResults(city, { checkIn, checkOut }, hotelProvider)
    ),
    flights: toSafeResult(
      getResults(city, { fromCity, departDate: checkIn }, flightProvider)
    ),
    carRental: toSafeResult(
      getResults(
        city,
        { pickUpDate: checkIn, dropOffDate: checkOut, usdToZarRate },
        carRentalProvider
      )
    ),
  };

  const results = {};
  for (const [key, task] of Object.entries(tasks)) {
    results[key] = await task;
  }

  results.exchangeRate = { usdToZar: usdToZarRate };

  // Save the search + results to history — fire and forget, don't block the response on it
  SearchHistory.create({ city, fromCity, checkIn, checkOut, results }).catch(
    (err) => console.error("Failed to save search history:", err.message)
  );

  res.json(results);
});

// List past searches, most recent first
app.get("/api/history", async (req, res) => {
  try {
    const history = await SearchHistory.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select("-results"); // don't send the full heavy results blob in the list view
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Get one past search with full results
app.get("/api/history/:id", async (req, res) => {
  try {
    const entry = await SearchHistory.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: "Not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch search" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);