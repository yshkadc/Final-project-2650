// models/Log.js
// Accountability: every HTTP request/response is recorded here
const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  method:       { type: String },
  url:          { type: String },
  statusCode:   { type: Number },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userRole:     { type: String, default: 'guest' },
  ipAddress:    { type: String },
  userAgent:    { type: String },
  responseTime: { type: Number }, // milliseconds
  timestamp:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);
