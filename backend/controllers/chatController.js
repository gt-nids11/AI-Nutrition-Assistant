const ChatHistory = require('../models/ChatHistory');
const UserProfile = require('../models/UserProfile');
const PantryItem = require('../models/PantryItem');
const NutritionLog = require('../models/NutritionLog');
const aiService = require('../services/aiService');

// @desc    Get chat history
// @route   GET /api/chat
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const history = await ChatHistory.find({ user: req.user.id }).sort({ timestamp: 1 });
    res.json({ success: true, count: history.length, history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send a message to the AI chatbot
// @route   POST /api/chat
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    // 1. Save user message to database
    const userMsg = await ChatHistory.create({
      user: req.user.id,
      role: 'user',
      content: message
    });

    // 2. Fetch User Context
    const profile = await UserProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(400).json({ success: false, message: 'Please set up your health profile first.' });
    }

    const pantryItems = await PantryItem.find({ user: req.user.id });
    
    // Find expiring items
    const today = new Date();
    const threeDays = new Date();
    threeDays.setDate(today.getDate() + 3);
    const expiringItems = pantryItems.filter(item => item.expiryDate <= threeDays);

    // Find daily nutrition logs
    const dateStr = new Date().toISOString().split('T')[0];
    const nutritionLog = await NutritionLog.findOne({ user: req.user.id, date: dateStr });
    
    const consumedCalories = nutritionLog ? nutritionLog.totalCalories : 0;
    const consumedProtein = nutritionLog ? nutritionLog.totalProtein : 0;
    const consumedCarbs = nutritionLog ? nutritionLog.totalCarbs : 0;
    const consumedFat = nutritionLog ? nutritionLog.totalFat : 0;

    const userContext = {
      name: req.user.name,
      goal: profile.goal,
      calorieTarget: profile.calorieTarget || 2000,
      consumedCalories,
      remainingProtein: Math.max(0, (profile.proteinTarget || 0) - consumedProtein),
      remainingCarbs: Math.max(0, (profile.carbTarget || 0) - consumedCarbs),
      remainingFat: Math.max(0, (profile.fatTarget || 0) - consumedFat),
      dietaryRestrictions: profile.dietaryRestrictions || [],
      favoriteCuisines: profile.favoriteCuisines || [],
      pantryItems,
      expiringItems
    };

    // Get previous history (limit to last 15 messages for LLM context window)
    const rawHistory = await ChatHistory.find({ user: req.user.id })
      .sort({ timestamp: -1 })
      .limit(15);
    
    const chatHistory = rawHistory.reverse().map(h => ({
      role: h.role,
      content: h.content
    }));

    // 3. Call AI Service
    const customKeyConfig = profile.customApiKey;
    const reply = await aiService.generateChatResponse(chatHistory, userContext, customKeyConfig);

    // 4. Save Bot response to database
    const assistantMsg = await ChatHistory.create({
      user: req.user.id,
      role: 'assistant',
      content: reply
    });

    res.json({
      success: true,
      userMessage: userMsg,
      botResponse: assistantMsg
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear chat history
// @route   DELETE /api/chat
// @access  Private
exports.clearHistory = async (req, res) => {
  try {
    await ChatHistory.deleteMany({ user: req.user.id });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
