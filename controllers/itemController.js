// controllers/itemController.js
const DataMapperFactory = require('../utils/dataMapperFactory');

// Helper: determine expiry status
function getExpiryStatus(item) {
  if (!item.expiryDate) return 'none';
  const today = new Date();
  const soon  = new Date();
  soon.setDate(today.getDate() + 7);
  if (item.expiryDate < today)   return 'expired';
  if (item.expiryDate <= soon)   return 'soon';
  return 'ok';
}

// GET /items/dashboard
exports.getDashboard = async (req, res) => {
  const itemMapper = DataMapperFactory.createMapper('item');
  try {
    const items = await itemMapper.findAll({ owner: req.session.user._id });
    const enriched = items.map(i => ({ ...i.toObject(), expiryStatus: getExpiryStatus(i) }));
    const expired  = enriched.filter(i => i.expiryStatus === 'expired');
    const soon     = enriched.filter(i => i.expiryStatus === 'soon');
    res.render('dashboard', { items: enriched, expired, soon });
  } catch (err) {
    console.error(err);
    res.render('dashboard', { items: [], expired: [], soon: [] });
  }
};

// GET /items/add
exports.getAddItem = (req, res) => {
  res.render('addItem', { error: null });
};

// POST /items/add
exports.postAddItem = async (req, res) => {
  const { name, category, quantity, unit, expiryDate, location, notes } = req.body;
  const itemMapper = DataMapperFactory.createMapper('item');
  try {
    await itemMapper.create({
      name, category,
      quantity: Number(quantity) || 1,
      unit,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      location,
      notes,
      owner: req.session.user._id
    });
    res.redirect('/items/dashboard');
  } catch (err) {
    console.error(err);
    res.render('addItem', { error: 'Failed to add item. Please try again.' });
  }
};

// GET /items/edit/:id
exports.getEditItem = async (req, res) => {
  const itemMapper = DataMapperFactory.createMapper('item');
  try {
    const item = await itemMapper.findById(req.params.id);
    if (!item || item.owner.toString() !== req.session.user._id) {
      return res.redirect('/items/dashboard');
    }
    res.render('editItem', { item, error: null });
  } catch (err) {
    res.redirect('/items/dashboard');
  }
};

// POST /items/edit/:id
exports.postEditItem = async (req, res) => {
  const { name, category, quantity, unit, expiryDate, location, notes } = req.body;
  const itemMapper = DataMapperFactory.createMapper('item');
  try {
    await itemMapper.update(req.params.id, {
      name, category,
      quantity: Number(quantity) || 1,
      unit,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      location,
      notes,
      updatedAt: new Date()
    });
    res.redirect('/items/dashboard');
  } catch (err) {
    console.error(err);
    const item = await DataMapperFactory.createMapper('item').findById(req.params.id);
    res.render('editItem', { item, error: 'Failed to update item.' });
  }
};

// POST /items/delete/:id
exports.deleteItem = async (req, res) => {
  const itemMapper = DataMapperFactory.createMapper('item');
  try {
    await itemMapper.delete(req.params.id);
  } catch (err) {
    console.error(err);
  }
  res.redirect('/items/dashboard');
};
