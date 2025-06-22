const express = require('express');
const router = express.Router();
const staffController = require('../cuntollers/staffCuntroller');
const {authenticateStaff} = require('../middleware/authmiddleware'); // admin-only

router.get('/staff/schedule', authenticateStaff, staffController.getStaffSchedule);
router.post('/attendance', authenticateStaff, staffController.markAttendance);
module.exports = router;
