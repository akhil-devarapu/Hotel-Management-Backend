const express = require('express');
const router = express.Router();
const { getGuestDetails ,updateGuestPreferences,getGuestHistory} = require('../cuntollers/guestController');
const {authenticateStaff} = require('../middleware/authmiddleware');

router.get('/:guestId', authenticateStaff, getGuestDetails);
router.put('/:guestId/preferences', updateGuestPreferences);
router.get('/:guestId/history', getGuestHistory);
module.exports = router;
