const express = require('express');
const router = express.Router();
const { getPlan, generatePlan, getGroceryList, generateGroceryList } = require('../controllers/plannerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getPlan);
router.post('/generate', generatePlan);
router.get('/grocery', getGroceryList);
router.post('/grocery/generate', generateGroceryList);

module.exports = router;
