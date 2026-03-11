// models/Notification.js
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  owner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item:      { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  type:      { type: String, enum: ['expired', 'expiring_soon', 'expiring_3days'], default: 'expiring_soon' },
  message:   { type: String, required: true },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
