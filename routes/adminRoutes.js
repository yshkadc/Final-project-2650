// routes/adminRoutes.js
const express = require('express');
const router  = express.Router();
const admin   = require('../controllers/adminController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Only admin role can access these routes
router.get('/',                   isAuthenticated, hasRole('admin'), admin.getAdminPanel);
router.post('/users/:id/delete',  isAuthenticated, hasRole('admin'), admin.deleteUser);
router.post('/users/:id/role',    isAuthenticated, hasRole('admin'), admin.updateUserRole);

module.exports = router;
