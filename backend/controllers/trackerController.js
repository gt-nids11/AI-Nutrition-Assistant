const MealLog = require('../models/MealLog');
const NutritionLog = require('../models/NutritionLog');
const UserProfile = require('../models/UserProfile');
const aiService = require('../services/aiService');

// Helper to update or create daily nutrition summary
const updateDailySummary = async (userId, dateStr) => {
  // Find all meals on this date
  const startOfDay = new Date(`${dateStr}T00:00:00`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999`);

  const meals = await MealLog.find({
    user: userId,
    loggedAt: { $gte: startOfDay, $lte: endOfDay }
  });

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;

  meals.forEach(m => {
    calories += m.calories || 0;
    protein += m.protein || 0;
    carbs += m.carbs || 0;
    fat += m.fat || 0;
    fiber += m.fiber || 0;
  });

  // Find or create daily log
  let nutritionLog = await NutritionLog.findOne({ user: userId, date: dateStr });
  if (!nutritionLog) {
    nutritionLog = new NutritionLog({
      user: userId,
      date: dateStr,
      waterIntake: 0
    });
  }

  nutritionLog.totalCalories = Math.round(calories);
  nutritionLog.totalProtein = Math.round(protein);
  nutritionLog.totalCarbs = Math.round(carbs);
  nutritionLog.totalFat = Math.round(fat);
  nutritionLog.totalFiber = Math.round(fiber);
  nutritionLog.updatedAt = Date.now();

  await nutritionLog.save();
  return nutritionLog;
};

// @desc    Log a new meal
// @route   POST /api/tracker/meal
// @access  Private
exports.logMeal = async (req, res) => {
  try {
    const { mealText, mealType, manualMacros, date } = req.body;

    if (!mealType) {
      return res.status(400).json({ success: false, message: 'Please provide meal type' });
    }

    const dateStr = date || new Date().toISOString().split('T')[0];
    const profile = await UserProfile.findOne({ user: req.user.id });
    const customKeyConfig = profile ? profile.customApiKey : null;

    let foodDetails;

    if (manualMacros) {
      // Manual logging
      foodDetails = {
        foodName: manualMacros.foodName || 'Logged Meal',
        calories: Number(manualMacros.calories || 0),
        protein: Number(manualMacros.protein || 0),
        carbs: Number(manualMacros.carbs || 0),
        fat: Number(manualMacros.fat || 0),
        fiber: Number(manualMacros.fiber || 0)
      };
    } else {
      // Natural language logging
      if (!mealText) {
        return res.status(400).json({ success: false, message: 'Please provide meal description or manual macros' });
      }
      foodDetails = await aiService.analyzeMealLog(mealText, customKeyConfig);
    }

    // Create meal log
    // Match date string to log timestamp
    const logTime = new Date(`${dateStr}T12:00:00`); // mid-day default for logs on specific days

    const mealLog = await MealLog.create({
      user: req.user.id,
      foodName: foodDetails.foodName,
      mealType,
      calories: foodDetails.calories,
      protein: foodDetails.protein,
      carbs: foodDetails.carbs,
      fat: foodDetails.fat,
      fiber: foodDetails.fiber,
      loggedAt: logTime
    });

    // Update daily summary
    const summary = await updateDailySummary(req.user.id, dateStr);

    res.status(201).json({
      success: true,
      mealLog,
      summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete logged meal
// @route   DELETE /api/tracker/meal/:id
// @access  Private
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await MealLog.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({ success: false, message: 'Meal not found' });
    }

    if (meal.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const dateStr = meal.loggedAt.toISOString().split('T')[0];
    await MealLog.deleteOne({ _id: req.params.id });

    // Update summary
    const summary = await updateDailySummary(req.user.id, dateStr);

    res.json({ success: true, message: 'Meal log removed', summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get daily summary and logged meals
// @route   GET /api/tracker/daily/:date
// @access  Private
exports.getDailySummary = async (req, res) => {
  try {
    const dateStr = req.params.date; // format YYYY-MM-DD
    
    // Find daily summary
    let summary = await NutritionLog.findOne({ user: req.user.id, date: dateStr });
    if (!summary) {
      // Create a blank one for ease of dashboard reading
      summary = await NutritionLog.create({
        user: req.user.id,
        date: dateStr,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        waterIntake: 0
      });
    }

    // Find logged meals
    const startOfDay = new Date(`${dateStr}T00:00:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999`);

    const meals = await MealLog.find({
      user: req.user.id,
      loggedAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ loggedAt: 1 });

    res.json({
      success: true,
      summary,
      meals
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log/Update water intake
// @route   POST /api/tracker/water
// @access  Private
exports.updateWaterIntake = async (req, res) => {
  try {
    const { amount, date } = req.body; // amount is added (e.g. +250 or -250)
    const dateStr = date || new Date().toISOString().split('T')[0];

    if (amount === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide amount to add' });
    }

    let summary = await NutritionLog.findOne({ user: req.user.id, date: dateStr });
    if (!summary) {
      summary = new NutritionLog({
        user: req.user.id,
        date: dateStr,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        waterIntake: 0
      });
    }

    summary.waterIntake = Math.max(0, summary.waterIntake + Number(amount));
    summary.updatedAt = Date.now();
    await summary.save();

    res.json({
      success: true,
      waterIntake: summary.waterIntake,
      summary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get historical logs for analytics
// @route   GET /api/tracker/history
// @access  Private
exports.getMealHistory = async (req, res) => {
  try {
    const { filter } = req.query; // day, week, month
    let startDate = new Date();

    if (filter === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (filter === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      // Default to 7 days
      startDate.setDate(startDate.getDate() - 7);
    }

    // Retrieve daily summaries in the range
    const startStr = startDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const summaries = await NutritionLog.find({
      user: req.user.id,
      date: { $gte: startStr, $lte: todayStr }
    }).sort({ date: 1 });

    const meals = await MealLog.find({
      user: req.user.id,
      loggedAt: { $gte: startDate }
    }).sort({ loggedAt: -1 });

    res.json({
      success: true,
      filter,
      summaries,
      meals
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Lookup nutritional values for a query without logging
// @route   GET /api/tracker/nutrition-lookup
// @access  Private
exports.getNutritionLookup = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Please provide a food query' });
    }

    const profile = await UserProfile.findOne({ user: req.user.id });
    const customKeyConfig = profile ? profile.customApiKey : null;

    const foodDetails = await aiService.analyzeMealLog(query, customKeyConfig);

    res.json({
      success: true,
      query,
      nutrition: foodDetails
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

