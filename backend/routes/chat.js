const express = require('express');
const router = express.Router();
const { getHistory, sendMessage, clearHistory } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getHistory)
  .post(sendMessage)
  .delete(clearHistory);

module.exports = router;
