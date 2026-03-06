// utils/dbUtil.js
// MongoDB Utility Module
// Design Pattern: Module Pattern (IIFE exposing public API)
// Supports both local and remote MongoDB connections

const MongoUtil = (function () {
  'use strict';

  const mongoose = require('mongoose');

  // Private: generic connect
  const _connect = async (uri) => {
    try {
      await mongoose.connect(uri);
      console.log(`[MongoUtil] Connected to: ${uri}`);
      return mongoose.connection;
    } catch (err) {
      console.error('[MongoUtil] Connection failed:', err.message);
      throw err;
    }
  };

  // Private: get current connection state
  const _isConnected = () => mongoose.connection.readyState === 1;

  // Public API
  const connectLocal = () => {
    const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/smart_home_inventory';
    return _connect(localUri);
  };

  const connectRemote = () => {
    const remoteUri = process.env.MONGODB_URI;
    if (!remoteUri) throw new Error('[MongoUtil] MONGODB_URI is not defined in .env');
    return _connect(remoteUri);
  };

  const getStatus = () => ({
    readyState: mongoose.connection.readyState,
    isConnected: _isConnected(),
    host: mongoose.connection.host,
    dbName: mongoose.connection.name
  });

  return { connectLocal, connectRemote, getStatus };
})();

module.exports = MongoUtil;
