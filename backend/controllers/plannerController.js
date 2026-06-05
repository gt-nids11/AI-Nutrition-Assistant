const UserProfile = require('../models/UserProfile');
const PantryItem = require('../models/PantryItem');
const aiService = require('../services/aiService');

// @desc    Get current weekly meal plan
// @route   GET /api/planner
// @access  Private
exports.getPlan = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(400).json({ success: false, message: 'Please create health profile first' });
    }

    // If plan doesn't exist, auto-generate a starter one
    if (!profile.mealPlan) {
      const pantryItems = await PantryItem.find({ user: req.user.id });
      const plan = await aiService.generateWeeklyMealPlan({
        goal: profile.goal,
        dietaryRestrictions: profile.dietaryRestrictions || [],
        favoriteCuisines: profile.favoriteCuisines || [],
        pantryItems
      }, profile.customApiKey);

      profile.mealPlan = plan;
      await profile.save();
    }

    res.json({ success: true, mealPlan: profile.mealPlan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate / Regenerate a new weekly meal plan
// @route   POST /api/planner/generate
// @access  Private
exports.generatePlan = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(400).json({ success: false, message: 'Please create health profile first' });
    }

    const pantryItems = await PantryItem.find({ user: req.user.id });
    
    const plan = await aiService.generateWeeklyMealPlan({
      goal: profile.goal,
      dietaryRestrictions: profile.dietaryRestrictions || [],
      favoriteCuisines: profile.favoriteCuisines || [],
      pantryItems
    }, profile.customApiKey);

    profile.mealPlan = plan;
    await profile.save();

    res.json({ success: true, mealPlan: plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get grocery recommendation list
// @route   GET /api/planner/grocery
// @access  Private
exports.getGroceryList = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(400).json({ success: false, message: 'Please create health profile first' });
    }

    // If list doesn't exist, auto-generate one
    if (!profile.groceryList) {
      const pantryItems = await PantryItem.find({ user: req.user.id });
      const groceryData = await aiService.generateGroceryRecommendations(
        pantryItems,
        profile.goal,
        profile.customApiKey
      );

      profile.groceryList = groceryData;
      await profile.save();
    }

    res.json({ success: true, groceryList: profile.groceryList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate / Regenerate grocery recommendations
// @route   POST /api/planner/grocery/generate
// @access  Private
exports.generateGroceryList = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(400).json({ success: false, message: 'Please create health profile first' });
    }

    const pantryItems = await PantryItem.find({ user: req.user.id });
    const groceryData = await aiService.generateGroceryRecommendations(
      pantryItems,
      profile.goal,
      profile.customApiKey
    );

    profile.groceryList = groceryData;
    await profile.save();

    res.json({ success: true, groceryList: groceryData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
