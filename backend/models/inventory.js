const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Update your group schema in models/inventory.js

// Schema for a group with _id = name
const groupSchema = new Schema({
  _id: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    index: true, // Index the name field for faster lookups
    default: function() {
      return this._id; // Default name to _id if not specified
    }
  },
  vars: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
  children: { 
    type: [String], 
    default: [] 
  },
  hosts: { 
    type: [String], 
    default: [] 
  }
}, { 
  timestamps: true,
  versionKey: false,
  _id: false // Use the provided _id instead of generating one
});

// Ensure name and _id are in sync
groupSchema.pre('save', function(next) {
  if (!this.name && this._id) {
    this.name = this._id;
  } else if (!this._id && this.name) {
    this._id = this.name;
  }
  next();
});

// Schema for a host with _id = name
const hostSchema = new Schema({
  _id: { 
    type: String,
    required: true,
    default: function() {
      return this.name; // Default _id to name if not specified
    }
  },
  name: { 
    type: String, 
    required: true,
    index: true, // Index the name field for faster lookups
    unique: true  // Ensure name is unique
  },
  vars: { 
    type: Schema.Types.Mixed, 
    default: {} 
  }
}, { 
  timestamps: true,
  versionKey: false,
  _id: false // Use the provided _id instead of generating one
});

// Set up a pre-save middleware to ensure _id matches name
hostSchema.pre('save', function(next) {
  // Ensure _id matches name before saving
  this._id = this.name;
  next();
});

// Set up a pre-findOneAndUpdate middleware to handle updates
hostSchema.pre('findOneAndUpdate', function(next) {
  // If creating a new document via upsert, ensure _id = name
  if (this.getUpdate().$setOnInsert) {
    const name = this.getQuery().name;
    this.getUpdate().$setOnInsert._id = name;
  }
  next();
});

// Create models
const Host = mongoose.model('Host', hostSchema);
const Group = mongoose.model('Group', groupSchema);

module.exports = {
  Group,
  Host
};