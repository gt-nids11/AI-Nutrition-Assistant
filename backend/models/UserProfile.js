const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  age: {
    type: Number,
    required: [true, 'Please add age']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Please select gender']
  },
  height: {
    type: Number,
    required: [true, 'Please add height in cm']
  },
  weight: {
    type: Number,
    required: [true, 'Please add weight in kg']
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'extra'],
    required: [true, 'Please select activity level']
  },
  goal: {
    type: String,
    enum: ['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'healthy_lifestyle'],
    required: [true, 'Please select goal']
  },
  bmr: {
    type: Number
  },
  tdee: {
    type: Number
  },
  calorieTarget: {
    type: Number
  },
  proteinTarget: {
    type: Number
  },
  carbTarget: {
    type: Number
  },
  fatTarget: {
    type: Number
  },
  dietaryRestrictions: {
    type: [String],
    default: []
  },
  favoriteCuisines: {
    type: [String],
    default: []
  },
  frequentlyEaten: {
    type: [String],
    default: []
  },
  preferredMealTimings: {
    breakfast: { type: String, default: '08:00' },
    lunch: { type: String, default: '13:00' },
    dinner: { type: String, default: '20:00' },
    snacks: { type: String, default: '16:00' }
  },
  customApiKey: {
    provider: { type: String, enum: ['none', 'gemini', 'openai'], default: 'none' },
    key: { type: String, default: '' }
  },
  mealPlan: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  groceryList: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
