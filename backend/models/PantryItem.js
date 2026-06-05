const mongoose = require('mongoose');

const pantryItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add ingredient name'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Please add quantity'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Please add unit'],
    default: 'pcs' // e.g. grams, kg, pcs, ml, liters, cups
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add expiry date']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PantryItem', pantryItemSchema);
