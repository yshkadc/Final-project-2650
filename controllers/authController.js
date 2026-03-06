// controllers/authController.js
const DataMapperFactory = require('../utils/dataMapperFactory');
const User = require('../models/User');

// GET /login
exports.getLogin = (req, res) => {
  if (req.session.user) return res.redirect('/items/dashboard');
  res.render('login', { error: null });
};

// POST /login
exports.postLogin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.render('login', { error: 'Invalid username or password.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid username or password.' });
    }
    // Store user info in session (Authorization: role-based)
    req.session.user = {
      _id:      user._id.toString(),
      username: user.username,
      role:     user.role
    };
    res.redirect('/items/dashboard');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Server error. Please try again.' });
  }
};

// GET /register
exports.getRegister = (req, res) => {
  if (req.session.user) return res.redirect('/items/dashboard');
  res.render('register', { error: null });
};

// POST /register
exports.postRegister = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const userMapper = DataMapperFactory.createMapper('user');
    // Only allow member or guest roles during self-registration
    const safeRole = ['member', 'guest'].includes(role) ? role : 'guest';
    await userMapper.create({ username: username.trim(), email: email.trim(), password, role: safeRole });
    res.redirect('/login');
  } catch (err) {
    const isDuplicate = err.code === 11000;
    res.render('register', { error: isDuplicate ? 'Username or email already exists.' : 'Registration failed. Please try again.' });
  }
};

// GET /logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};
