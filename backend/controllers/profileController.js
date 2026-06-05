const UserProfile = require('../models/UserProfile');

// Helper to calculate BMR, TDEE and Macro Targets
const calculateTargets = (profile) => {
  const { weight, height, age, gender, activityLevel, goal } = profile;
  
  // 1. Calculate BMR (Mifflin-St Jeor Equation)
  let bmr = 0;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    // 'other' - average gender neutral formula
    bmr = 10 * weight + 6.25 * height - 5 * age - 78;
  }

  // 2. Calculate TDEE (Total Daily Energy Expenditure) based on Activity Level
  const activityFactors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    extra: 1.9
  };
  const factor = activityFactors[activityLevel] || 1.2;
  const tdee = bmr * factor;

  // 3. Calorie Target based on Goal
  let calorieTarget = tdee;
  if (goal === 'weight_loss') {
    calorieTarget = tdee - 500;
  } else if (goal === 'weight_gain') {
    calorieTarget = tdee + 500;
  } else if (goal === 'muscle_gain') {
    calorieTarget = tdee + 300;
  } else if (goal === 'maintenance' || goal === 'healthy_lifestyle') {
    calorieTarget = tdee;
  }

  // Set safety minimum
  if (calorieTarget < 1200) calorieTarget = 1200;

  // 4. Macro Targets
  // Protein (grams per kg bodyweight)
  let proteinPerKg = 1.5;
  if (goal === 'weight_loss') {
    proteinPerKg = 2.0;
  } else if (goal === 'weight_gain' || goal === 'muscle_gain') {
    proteinPerKg = 2.2;
  } else if (goal === 'maintenance') {
    proteinPerKg = 1.8;
  }

  let proteinTarget = weight * proteinPerKg;
  // Fat target is set to 25% of daily calories
  let fatCalories = calorieTarget * 0.25;
  let fatTarget = fatCalories / 9;

  // Carbs target is the remaining calories
  let proteinCalories = proteinTarget * 4;
  let fatCaloryValue = fatTarget * 9;
  let carbCalories = calorieTarget - (proteinCalories + fatCaloryValue);
  let carbTarget = carbCalories / 4;

  if (carbTarget < 0) carbTarget = 0; // sanity check

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calorieTarget: Math.round(calorieTarget),
    proteinTarget: Math.round(proteinTarget),
    carbTarget: Math.round(carbTarget),
    fatTarget: Math.round(fatTarget)
  };
};

// @desc    Get user health profile
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create or update user health profile (Onboarding)
// @route   POST /api/profile
// @access  Private
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const { age, gender, height, weight, activityLevel, goal } = req.body;

    if (!age || !gender || !height || !weight || !activityLevel || !goal) {
      return res.status(400).json({ success: false, message: 'Please provide all onboarding fields' });
    }

    let profile = await UserProfile.findOne({ user: req.user.id });

    const healthData = {
      user: req.user.id,
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
      activityLevel,
      goal,
      updatedAt: Date.now()
    };

    // Calculate metrics
    const calculated = calculateTargets(healthData);
    Object.assign(healthData, calculated);

    if (profile) {
      // Update existing
      profile = await UserProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: healthData },
        { new: true }
      );
    } else {
      // Create new profile
      profile = await UserProfile.create(healthData);
    }

    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update preferences (Restrictions, Cuisines, API Keys)
// @route   PUT /api/profile/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
  try {
    const { dietaryRestrictions, favoriteCuisines, customApiKey, preferredMealTimings } = req.body;

    let profile = await UserProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found. Please onboarding first.' });
    }

    if (dietaryRestrictions !== undefined) profile.dietaryRestrictions = dietaryRestrictions;
    if (favoriteCuisines !== undefined) profile.favoriteCuisines = favoriteCuisines;
    if (customApiKey !== undefined) profile.customApiKey = customApiKey;
    if (preferredMealTimings !== undefined) profile.preferredMealTimings = preferredMealTimings;
    
    profile.updatedAt = Date.now();
    await profile.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
