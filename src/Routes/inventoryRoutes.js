const express = require('express');
const router = express.Router();
const inventoryController = require('../cuntollers/inventorycuntroller');
const { authenticateStaff } = require('../middleware/authmiddleware');
router.get('/', authenticateStaff, inventoryController.getInventory);
router.post('/usage', authenticateStaff, inventoryController.recordInventoryUsage);

module.exports = router;
