// models/Item.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  category:   { type: String, enum: ['fridge', 'pantry', 'medicine', 'cleaning', 'other'], default: 'other' },
  quantity:   { type: Number, default: 1, min: 0 },
  unit:       { type: String, default: 'pcs' },
  expiryDate: { type: Date, default: null },
  location:   { type: String, default: 'Home' },
  notes:      { type: String, default: '' },
  owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', ItemSchema);
