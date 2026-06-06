const express = require('express');
const router = express.Router();
const { logMeal, deleteMeal, updateMeal, getDailySummary, updateWaterIntake, getMealHistory, getNutritionLookup } = require('../controllers/trackerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/meal', logMeal);
router.put('/meal/:id', updateMeal);
router.delete('/meal/:id', deleteMeal);
router.get('/daily/:date', getDailySummary);
router.post('/water', updateWaterIntake);
router.get('/history', getMealHistory);
router.get('/nutrition-lookup', getNutritionLookup);

module.exports = router;

