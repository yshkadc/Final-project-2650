// controllers/apiController.js
// RESTful Web API – client uses HTTP GET / POST against this Node.js server
// Server-side: calls OpenWeatherMap external Web Service API

const axios = require('axios');
const DataMapperFactory = require('../utils/dataMapperFactory');

// ── External API ──────────────────────────────────────────────────────────────
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
