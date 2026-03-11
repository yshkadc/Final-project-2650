// controllers/adminController.js
const DataMapperFactory = require('../utils/dataMapperFactory');

// GET /admin
exports.getAdminPanel = async (req, res) => {
  const userMapper = DataMapperFactory.createMapper('user');
  const logMapper  = DataMapperFactory.createMapper('log');
  const itemMapper = DataMapperFactory.createMapper('item');
  try {
    const users      = await userMapper.findAll();
    const logs       = await logMapper.findAll({}, { sort: { timestamp: -1 }, limit: 100 });
    const items      = await itemMapper.findAll();
    const totalItems = items.length;
    res.render('admin', { users, logs, totalItems });
  } catch (err) {
    console.error(err);
    res.render('admin', { users: [], logs: [], totalItems: 0 });
  }
};

// POST /admin/users/:id/delete
exports.deleteUser = async (req, res) => {
  const userMapper = DataMapperFactory.createMapper('user');
  try {
    // Prevent self-deletion
    if (req.params.id !== req.session.user._id) {
      await userMapper.delete(req.params.id);
    }
  } catch (err) {
    console.error(err);
  }
  res.redirect('/admin');
};

// POST /admin/users/:id/role
exports.updateUserRole = async (req, res) => {
  const userMapper = DataMapperFactory.createMapper('user');
  const validRoles = ['admin', 'member', 'guest'];
  try {
    if (validRoles.includes(req.body.role)) {
      await userMapper.update(req.params.id, { role: req.body.role });
    }
  } catch (err) {
    console.error(err);
  }
  res.redirect('/admin');
};
