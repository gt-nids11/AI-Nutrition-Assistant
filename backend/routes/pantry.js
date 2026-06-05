const express = require('express');
const router = express.Router();
const { getPantryItems, addPantryItem, editPantryItem, deletePantryItem, getExpiringItems } = require('../controllers/pantryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getPantryItems)
  .post(addPantryItem);

router.get('/expiring', getExpiringItems);

router.route('/:id')
  .put(editPantryItem)
  .delete(deletePantryItem);

module.exports = router;
