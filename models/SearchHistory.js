const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  city: { type: String, required: true },
  fromCity: { type: String, default: 'Johannesburg' },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  results: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
