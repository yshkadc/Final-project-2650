// routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../controllers/authController');

router.get('/',         (req, res) => res.render('index'));
router.get('/login',    auth.getLogin);
router.post('/login',   auth.postLogin);
router.get('/register', auth.getRegister);
router.post('/register',auth.postRegister);
router.get('/logout',   auth.logout);

module.exports = router;
