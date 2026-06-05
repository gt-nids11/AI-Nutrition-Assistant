const express = require('express');
const router = express.Router();
const { getProfile, createOrUpdateProfile, updatePreferences } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getProfile)
  .post(createOrUpdateProfile);

router.put('/preferences', updatePreferences);

module.exports = router;
