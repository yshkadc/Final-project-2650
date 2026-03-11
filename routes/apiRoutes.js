// routes/apiRoutes.js
// RESTful API routes (GET and POST)
const express = require('express');
const router  = express.Router();
const api     = require('../controllers/apiController');
const { isAuthenticated } = require('../middleware/auth');

// External API (OpenWeatherMap) – accessible to everyone (guest use on home page too)
router.get('/weather',       api.getWeather);

// External API (Open Food Facts) – barcode product lookup
router.get('/barcode/:code', isAuthenticated, api.lookupBarcode);

// Internal RESTful item API (requires authentication)
router.get('/items',         isAuthenticated, api.getItems);
router.get('/items/:id',     isAuthenticated, api.getItemById);
router.post('/items',        isAuthenticated, api.postItem);

// Notification API
router.get('/notifications',          isAuthenticated, api.getNotifications);
router.post('/notifications/:id/read', isAuthenticated, api.markNotificationRead);
router.post('/notifications/read-all', isAuthenticated, api.markAllRead);

module.exports = router;
