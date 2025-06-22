const express = require('express');
const router = express.Router();
const { createBooking } = require('../cuntollers/bookingsCuntroller');
const{getAllBookings}=require("../cuntollers/bookingsCuntroller")
const { authenticateStaff } = require('../middleware/authmiddleware');
const { checkInBooking ,checkoutBooking} = require('../cuntollers/bookingsCuntroller');

router.get('/getdetails', authenticateStaff, getAllBookings);
router.put('/:bookingId/checkin', authenticateStaff, checkInBooking);
router.put('/:bookingId/checkout', authenticateStaff, checkoutBooking);
router.post('/create', createBooking);

module.exports = router;
