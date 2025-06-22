const express = require('express');
const router = express.Router();
const reportsController = require('../cuntollers/reportscuntroller');
const { authenticateStaff } = require('../middleware/authmiddleware');

router.get('/occupancy', authenticateStaff, reportsController.getOccupancyReport);
router.get('/revenue', authenticateStaff, reportsController.getRevenueReport);
router.get('/occupancy', authenticateStaff, reportsController.getOccupancyReport);
module.exports = router;
