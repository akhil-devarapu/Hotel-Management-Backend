// routes/restaurantRoutes.js
const express = require('express');
const router = express.Router();
const { getRestaurantMenu,placeRoomServiceOrder,getAllOrders,updateOrderStatus} = require('../cuntollers/restuarantcuntroller');
const {authenticateStaff}=require('../middleware/authmiddleware')
router.get('/menu', getRestaurantMenu);
router.post('/order', placeRoomServiceOrder); 
router.get('/orders', authenticateStaff,getAllOrders);
router.put('/orders/:orderId/status', authenticateStaff, updateOrderStatus);
module.exports = router;
