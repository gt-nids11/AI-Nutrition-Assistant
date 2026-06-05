const mongoose = require('mongoose');

const mealLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodName: {
    type: String,
    required: [true, 'Please add food name']
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: [true, 'Please select meal type']
  },
  calories: {
    type: Number,
    required: true,
    default: 0
  },
  protein: {
    type: Number,
    required: true,
    default: 0
  },
  carbs: {
    type: Number,
    required: true,
    default: 0
  },
  fat: {
    type: Number,
    required: true,
    default: 0
  },
  fiber: {
    type: Number,
    required: true,
    default: 0
  },
  loggedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MealLog', mealLogSchema);
