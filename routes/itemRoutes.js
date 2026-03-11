// routes/itemRoutes.js
const express = require('express');
const router  = express.Router();
const item    = require('../controllers/itemController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

router.get('/dashboard',      isAuthenticated, item.getDashboard);
router.get('/add',            isAuthenticated, hasRole('admin', 'member'), item.getAddItem);
router.post('/add',           isAuthenticated, hasRole('admin', 'member'), item.postAddItem);
router.get('/scan',           isAuthenticated, hasRole('admin', 'member'), item.getScanPage);
router.get('/edit/:id',       isAuthenticated, hasRole('admin', 'member'), item.getEditItem);
router.post('/edit/:id',      isAuthenticated, hasRole('admin', 'member'), item.postEditItem);
router.post('/delete/:id',    isAuthenticated, hasRole('admin', 'member'), item.deleteItem);

module.exports = router;
