// providers/carRental.js
//
// MOCKED — Booking.com's car rental search endpoint on RapidAPI returned
// consistent server errors (status: false, "Something went wrong...") when
// tested directly via their own "Test Endpoint" console, across multiple
// cities and retries on 2026-06-25. Treated as an unreliable third-party
// dependency rather than built against a broken endpoint. See build-log.md.

const MOCK_CARS = [
    { id: "car-1", make: "Toyota", model: "Corolla", type: "Sedan", pricePerDay: 450, currency: "ZAR", seats: 5, bags: 2, transmission: "Auto" },
    { id: "car-2", make: "VW", model: "Polo", type: "Hatchback", pricePerDay: 380, currency: "ZAR", seats: 5, bags: 1, transmission: "Manual" },
    { id: "car-3", make: "Toyota", model: "Fortuner", type: "SUV", pricePerDay: 950, currency: "ZAR", seats: 7, bags: 4, transmission: "Auto" },
    { id: "car-4", make: "Hyundai", model: "H1", type: "Van", pricePerDay: 1100, currency: "ZAR", seats: 9, bags: 6, transmission: "Auto" },
  ];
  
  async function resolveLocation(query) {
    // No real lookup needed for the mock — just pass the city through.
    return { name: query };
  }
  
  async function search(location, { pickupDate, dropoffDate }) {
    return {
      location: location.name,
      pickupDate,
      dropoffDate,
      cars: MOCK_CARS,
    };
  }
  
  module.exports = { resolveLocation, search };