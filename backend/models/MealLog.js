const mongoose = require('mongoose');

const ingredientSubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  grams: { type: Number, required: true },
  baseGrams: { type: Number, required: true },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 }
});

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
  
  // Base Nutritional Values for scaling (representing 1.0x serving size)
  baseCalories: {
    type: Number,
    required: true,
    default: 0
  },
  baseProtein: {
    type: Number,
    required: true,
    default: 0
  },
  baseCarbs: {
    type: Number,
    required: true,
    default: 0
  },
  baseFat: {
    type: Number,
    required: true,
    default: 0
  },
  baseFiber: {
    type: Number,
    required: true,
    default: 0
  },

  // Serving Controls
  servingSizeMultiplier: {
    type: Number,
    required: true,
    default: 1
  },
  customGrams: {
    type: Number,
    default: null
  },

  // Confidence & Assumptions
  confidenceScore: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  assumptions: {
    type: String,
    default: ''
  },

  // Ingredient Breakdown
  ingredients: [ingredientSubSchema],

  loggedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MealLog', mealLogSchema);
