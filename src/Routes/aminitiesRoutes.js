const express = require('express');
const router = express.Router();
const amenitiesController = require('../cuntollers/aminitiescuntroller');
const { authenticateStaff } = require('../middleware/authmiddleware');

router.get('/spa/availability', authenticateStaff, amenitiesController.getSpaAvailability);
router.post('/spa/book',  amenitiesController.bookSpaAppointment);
module.exports = router;
