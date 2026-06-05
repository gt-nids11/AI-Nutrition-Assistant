const express = require('express');
const router = express.Router();
const { logMeal, deleteMeal, getDailySummary, updateWaterIntake, getMealHistory } = require('../controllers/trackerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/meal', logMeal);
router.delete('/meal/:id', deleteMeal);
router.get('/daily/:date', getDailySummary);
router.post('/water', updateWaterIntake);
router.get('/history', getMealHistory);

module.exports = router;
