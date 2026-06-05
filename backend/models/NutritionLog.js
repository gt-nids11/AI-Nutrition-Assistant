const mongoose = require('mongoose');

const nutritionLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // format: YYYY-MM-DD
    required: true
  },
  totalCalories: {
    type: Number,
    default: 0
  },
  totalProtein: {
    type: Number,
    default: 0
  },
  totalCarbs: {
    type: Number,
    default: 0
  },
  totalFat: {
    type: Number,
    default: 0
  },
  totalFiber: {
    type: Number,
    default: 0
  },
  waterIntake: {
    type: Number, // in ml
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only have one daily record
nutritionLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);
