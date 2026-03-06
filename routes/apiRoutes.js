// routes/apiRoutes.js
// RESTful API routes (GET and POST)
const express = require('express');
const router  = express.Router();
const api     = require('../controllers/apiController');
const { isAuthenticated } = require('../middleware/auth');

// External API (OpenWeatherMap) – accessible to everyone (guest use on home page too)
router.get('/weather',       api.getWeather);

// Internal RESTful item API (requires authentication)
router.get('/items',         isAuthenticated, api.getItems);
router.get('/items/:id',     isAuthenticated, api.getItemById);
router.post('/items',        isAuthenticated, api.postItem);

module.exports = router;
