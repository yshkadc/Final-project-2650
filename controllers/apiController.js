// controllers/apiController.js
// RESTful Web API – client uses HTTP GET / POST against this Node.js server
// Server-side: calls OpenWeatherMap + Open Food Facts external Web Service APIs

const axios = require('axios');
const DataMapperFactory = require('../utils/dataMapperFactory');
const Notification = require('../models/Notification');
const Item = require('../models/Item');

// ── External API: JMA (Japan Meteorological Agency) Earthquake Info ──────────
// GET /api/earthquake
// Fetches recent earthquake information from Japan Meteorological Agency
exports.getEarthquake = async (req, res) => {
  try {
    // JMA provides earthquake list in JSON format (no API key required)
    const response = await axios.get(
      'https://www.jma.go.jp/bosai/quake/data/list.json',
      { timeout: 10000 }
    );

    // Get the latest 10 earthquakes
    const earthquakes = (response.data || []).slice(0, 10).map(eq => ({
      id: eq.eid,
      time: eq.at,           // Occurrence time
      magnitude: eq.mag,     // Magnitude
      maxIntensity: eq.maxi, // Maximum seismic intensity
      epicenter: eq.anm,     // Epicenter name (Japanese)
      depth: eq.dep,         // Depth (km)
      tsunami: eq.ttl && eq.ttl.includes('津波') ? true : false,
      title: eq.ttl          // Title/headline
    }));

    res.json({
      success: true,
      data: earthquakes,
      source: 'Japan Meteorological Agency (気象庁)',
      fetchedAt: new Date().toISOString()
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ success: false, message: 'JMA API timed out.' });
    }
    const status = err.response?.status || 500;
    res.status(status).json({ success: false, message: 'Earthquake data fetch failed.' });
  }
};

// ── External API: OpenWeatherMap ──────────────────────────────────────────────
// GET /api/weather?city=Calgary
exports.getWeather = async (req, res) => {
  const city = req.query.city || 'Calgary';
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
    return res.status(503).json({ success: false, message: 'OpenWeatherMap API key not configured.' });
  }

  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: city, appid: apiKey, units: 'metric' }
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ success: false, message: err.response?.data?.message || 'Weather API error.' });
  }
};

// ── External API: Open Food Facts (Barcode Lookup) ────────────────────────────
// GET /api/barcode/:code
// Calls https://world.openfoodfacts.org to look up product info by barcode
exports.lookupBarcode = async (req, res) => {
  const code = req.params.code;

  // Validate: barcode must be numeric digits only (EAN-8, EAN-13, UPC-A etc.)
  if (!code || !/^\d{4,14}$/.test(code)) {
    return res.status(400).json({ success: false, message: 'Invalid barcode format. Must be 4-14 digits.' });
  }

  try {
    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`,
      { timeout: 8000 }
    );

    if (response.data.status === 0) {
      return res.status(404).json({ success: false, message: 'Product not found in Open Food Facts database.' });
    }

    const product = response.data.product || {};

    // Extract useful fields
    const result = {
      barcode:       code,
      name:          product.product_name || product.product_name_en || '',
      brand:         product.brands || '',
      category:      _guessCategory(product.categories_tags || []),
      imageUrl:      product.image_front_small_url || product.image_url || '',
      quantity:      product.quantity || '',
      shelfLife:     _estimateShelfLife(product),
      suggestedExpiry: _suggestExpiryDate(product)
    };

    res.json({ success: true, data: result });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({ success: false, message: 'Open Food Facts API timed out.' });
    }
    const status = err.response?.status || 500;
    res.status(status).json({ success: false, message: 'Barcode lookup failed.' });
  }
};

// ── Notification endpoints ────────────────────────────────────────────────────
// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ owner: req.session.user._id })
      .sort({ createdAt: -1 }).limit(50).populate('item', 'name');
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/notifications/:id/read
exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.user._id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { owner: req.session.user._id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Generate expiry notifications (called on dashboard load) ──────────────────
exports.generateExpiryNotifications = async (userId) => {
  const today = new Date();
  const threeDays = new Date(); threeDays.setDate(today.getDate() + 3);
  const sevenDays = new Date(); sevenDays.setDate(today.getDate() + 7);

  const items = await Item.find({ owner: userId, expiryDate: { $ne: null } });

  for (const item of items) {
    const expiry = new Date(item.expiryDate);
    let type = null;
    let message = '';

    if (expiry < today) {
      type = 'expired';
      message = `"${item.name}" has expired on ${expiry.toLocaleDateString('en-CA')}!`;
    } else if (expiry <= threeDays) {
      type = 'expiring_3days';
      message = `"${item.name}" expires in less than 3 days (${expiry.toLocaleDateString('en-CA')}).`;
    } else if (expiry <= sevenDays) {
      type = 'expiring_soon';
      message = `"${item.name}" expires within 7 days (${expiry.toLocaleDateString('en-CA')}).`;
    }

    if (type) {
      // Only create if no duplicate notification exists for the same item+type today
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const existing = await Notification.findOne({
        owner: userId, item: item._id, type,
        createdAt: { $gte: startOfDay }
      });
      if (!existing) {
        await Notification.create({ owner: userId, item: item._id, type, message });
      }
    }
  }
};

// ── Helper: guess our app category from Open Food Facts tags ──────────────────
function _guessCategory(tags) {
  const joined = (tags || []).join(' ').toLowerCase();
  if (/dairy|milk|cheese|yogurt|cream|butter|beverage|drink|juice|water/.test(joined)) return 'fridge';
  if (/meat|fish|seafood|chicken|pork|beef|egg/.test(joined)) return 'fridge';
  if (/medicine|pharma|supplement|vitamin|health/.test(joined)) return 'medicine';
  if (/clean|detergent|soap|bleach|disinfect/.test(joined)) return 'cleaning';
  if (/grain|pasta|rice|cereal|snack|bread|flour|sugar|coffee|tea|sauce|canned|oil|spice|condiment|chocolate|cookie|biscuit/.test(joined)) return 'pantry';
  return 'pantry'; // default for food items
}

// ── Helper: estimate shelf life from product data ─────────────────────────────
function _estimateShelfLife(product) {
  // Check if Open Food Facts has a "periods_after_opening" or "expiration_date" field
  if (product.expiration_date) return product.expiration_date;
  if (product.periods_after_opening) return product.periods_after_opening;

  // Rough estimate based on category
  const tags = (product.categories_tags || []).join(' ').toLowerCase();
  if (/dairy|milk/.test(tags)) return '7-14 days';
  if (/meat|fish|seafood/.test(tags)) return '3-5 days';
  if (/bread/.test(tags)) return '5-7 days';
  if (/juice|beverage/.test(tags)) return '7-10 days';
  if (/canned/.test(tags)) return '1-3 years';
  if (/pasta|rice|grain|flour/.test(tags)) return '6-12 months';
  if (/snack|cookie|chocolate/.test(tags)) return '3-6 months';
  return 'Unknown';
}

// ── Helper: suggest an actual expiry date ─────────────────────────────────────
function _suggestExpiryDate(product) {
  // If OFF has an exact expiration date, parse it
  if (product.expiration_date) {
    const parsed = new Date(product.expiration_date);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
      return parsed.toISOString().split('T')[0];
    }
  }

  // Otherwise, estimate from category
  const tags = (product.categories_tags || []).join(' ').toLowerCase();
  const now = new Date();
  let daysToAdd = 30; // default 1 month

  if (/dairy|milk/.test(tags))            daysToAdd = 10;
  else if (/meat|fish|seafood/.test(tags)) daysToAdd = 4;
  else if (/bread/.test(tags))            daysToAdd = 6;
  else if (/juice|beverage/.test(tags))   daysToAdd = 8;
  else if (/canned/.test(tags))           daysToAdd = 365;
  else if (/pasta|rice|grain/.test(tags)) daysToAdd = 270;
  else if (/snack|cookie/.test(tags))     daysToAdd = 120;

  now.setDate(now.getDate() + daysToAdd);
  return now.toISOString().split('T')[0];
}

// ── Internal RESTful API (Items) ───────────────────────────────────────────────
// GET /api/items
exports.getItems = async (req, res) => {
  const itemMapper = DataMapperFactory.createMapper('item');
  try {
    const items = await itemMapper.findAll({ owner: req.session.user._id });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/items/:id
exports.getItemById = async (req, res) => {
  const itemMapper = DataMapperFactory.createMapper('item');
  try {
    const item = await itemMapper.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/items
exports.postItem = async (req, res) => {
  const itemMapper = DataMapperFactory.createMapper('item');
  try {
    const item = await itemMapper.create({ ...req.body, owner: req.session.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
