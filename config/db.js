// config/db.js
// Singleton Pattern - Ensures only one MongoDB connection instance exists

const mongoose = require('mongoose');

class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    this.connection = null;
    Database.instance = this;
  }

  async connect() {
    if (this.connection) {
      console.log('Reusing existing MongoDB connection (Singleton)');
      return this.connection;
    }
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_home_inventory';
      this.connection = await mongoose.connect(uri);
      console.log(`MongoDB connected: ${uri}`);
      return this.connection;
    } catch (err) {
      console.error('MongoDB connection error:', err.message);
      process.exit(1);
    }
  }
}

const db = new Database();
module.exports = () => db.connect();
