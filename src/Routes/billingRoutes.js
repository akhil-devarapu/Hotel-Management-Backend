// routes/billingRoutes.js
const express = require('express');
const router = express.Router();
const { getGuestBill,processPayment } = require('../cuntollers/billingcuntroller');
const {authenticateStaff} = require('../middleware/authmiddleware');
router.post('/payment', authenticateStaff, processPayment);
router.get('/bills/:bookingId', authenticateStaff, getGuestBill); // Staff only
module.exports = router;
