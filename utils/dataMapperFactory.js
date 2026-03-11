// utils/dataMapperFactory.js
// Design Pattern: Factory Method Pattern
// Creates DataMapper objects for different Mongoose models (User, Item, Log)
// Each DataMapper provides a consistent CRUD interface

class DataMapper {
  constructor(model) {
    this.model = model;
  }

  // Create - READ all with optional filter
  async findAll(filter = {}, options = {}) {
    return this.model.find(filter, null, options);
  }

  // Read one by ID
  async findById(id) {
    return this.model.findById(id);
  }

  // Read one by filter
  async findOne(filter) {
    return this.model.findOne(filter);
  }

  // Create
  async create(data) {
    return this.model.create(data);
  }

  // Update by ID
  async update(id, data) {
    return this.model.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  // Delete by ID
  async delete(id) {
    return this.model.findByIdAndDelete(id);
  }

  // Count documents
  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }
}

// Factory Method: returns the correct DataMapper based on model type
class DataMapperFactory {
  static createMapper(type) {
    const registeredModels = {
      user:         () => require('../models/User'),
      item:         () => require('../models/Item'),
      log:          () => require('../models/Log'),
      notification: () => require('../models/Notification')
    };

    const modelLoader = registeredModels[type.toLowerCase()];
    if (!modelLoader) {
      throw new Error(`[DataMapperFactory] Unknown model type: "${type}". Valid types: user, item, log, notification`);
    }

    return new DataMapper(modelLoader());
  }
}

module.exports = DataMapperFactory;
