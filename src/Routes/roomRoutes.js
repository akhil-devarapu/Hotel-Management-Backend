const express = require('express');
const router = express.Router();
const { getAllRooms,checkRoomAvailability,updateRoomStatus } = require('../cuntollers/roomCuntroller')
const { authenticateStaff } = require('../middleware/authmiddleware');

router.get('/rooms', getAllRooms);
router.get('/availability', checkRoomAvailability); 
router.put('/:roomId/status',authenticateStaff, updateRoomStatus);

module.exports = router;
