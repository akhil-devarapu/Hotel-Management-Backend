const express = require('express');
const router = express.Router();
const housekeepingController = require('../cuntollers/housekeepingCuntroller');
const { authenticateStaff } = require('../middleware/authmiddleware');

router.get('/schedule',housekeepingController.getSchedule);
router.post('/request',  housekeepingController.createRequest);
router.put('/:taskId/status', housekeepingController.updateStatus);


module.exports = router;
