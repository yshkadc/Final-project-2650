// middleware/logger.js
// Accountability: logs every request and response to MongoDB
const Log = require('../models/Log');

module.exports = async (req, res, next) => {
  const start = Date.now();

  res.on('finish', async () => {
    try {
      await Log.create({
        method:       req.method,
        url:          req.originalUrl,
        statusCode:   res.statusCode,
        userId:       req.session?.user?._id || null,
        userRole:     req.session?.user?.role || 'guest',
        ipAddress:    req.ip,
        userAgent:    req.headers['user-agent'],
        responseTime: Date.now() - start
      });
    } catch (_err) {
      // Silent fail – logging must never break the app
    }
  });

  next();
};
