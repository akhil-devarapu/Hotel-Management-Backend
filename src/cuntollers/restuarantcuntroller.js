// controllers/restaurantController.js
const db = require('../config/database');
const dayjs = require('dayjs');

const getRestaurantMenu = (req, res) => {
  const { category, available, vegetarian } = req.query;

  let query = `SELECT * FROM restaurant_menu WHERE 1=1`;
  const params = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  if (available !== undefined) {
    query += ` AND available = ?`;
    params.push(available === 'true' ? 1 : 0);
  }

  if (vegetarian !== undefined) {
    query += ` AND vegetarian = ?`;
    params.push(vegetarian === 'true' ? 1 : 0);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching menu:', err.message);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // Group menu items by category
    const groupedMenu = {};
    rows.forEach((item) => {
      if (!groupedMenu[item.category]) {
        groupedMenu[item.category] = [];
      }
      groupedMenu[item.category].push(item);
    });

    res.json({
      success: true,
      menu: groupedMenu,
    });
  });
};

const placeRoomServiceOrder = (req, res) => {
  const { roomNumber, items, deliveryTime } = req.body;

  if (!roomNumber || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Room number and items are required' });
  }

  // Calculate total amount
  let totalAmount = 0;
  const itemDetails = [];

  const placeholders = items.map(() => '?').join(',');
  const ids = items.map(item => item.menuItemId);

  db.all(`SELECT id, price FROM restaurant_menu WHERE id IN (${placeholders})`, ids, (err, rows) => {
    if (err || rows.length !== items.length) {
      return res.status(400).json({ success: false, message: 'Invalid menu item(s)' });
    }

    items.forEach(item => {
      const menuItem = rows.find(row => row.id === item.menuItemId);
      totalAmount += menuItem.price * item.quantity;
      itemDetails.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || ''
      });
    });

    // Create unique order ID
    const orderId = 'ORD' + dayjs().format('YYYYMMDDHHmmss');

    const estimatedDelivery = deliveryTime === 'immediate' ? '30 minutes' : deliveryTime;

    // Insert into restaurant_orders
    const insertOrder = `INSERT INTO restaurant_orders (orderId, roomNumber, totalAmount, deliveryTime, estimatedDelivery) VALUES (?, ?, ?, ?, ?)`;
    db.run(insertOrder, [orderId, roomNumber, totalAmount, deliveryTime, estimatedDelivery], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Failed to place order' });
      }

      // Insert order items
      const insertItem = db.prepare(`INSERT INTO restaurant_order_items (orderId, menuItemId, quantity, specialInstructions) VALUES (?, ?, ?, ?)`);
      itemDetails.forEach(item => {
        insertItem.run(orderId, item.menuItemId, item.quantity, item.specialInstructions);
      });
      insertItem.finalize();

      res.status(201).json({
        success: true,
        order: {
          orderId,
          roomNumber,
          totalAmount,
          estimatedDelivery,
          status: 'preparing'
        }
      });
    });
  });
};

const getAllOrders = (req, res) => {
   const role=req.user?.role;
    if (!role || !['Manager', 'Receptionist', 'Admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied: staff only' });
    }

  const sql = `
    SELECT o.*, i.menuItemId, i.quantity, i.specialInstructions, m.name as itemName
    FROM restaurant_orders o
    LEFT JOIN restaurant_order_items i ON o.orderId = i.orderId
    LEFT JOIN restaurant_menu m ON i.menuItemId = m.id
    ORDER BY o.createdAt DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    // Group orders by orderId
    const ordersMap = {};

    rows.forEach(row => {
      if (!ordersMap[row.orderId]) {
        ordersMap[row.orderId] = {
          orderId: row.orderId,
          roomNumber: row.roomNumber,
          totalAmount: row.totalAmount,
          deliveryTime: row.deliveryTime,
          estimatedDelivery: row.estimatedDelivery,
          status: row.status,
          createdAt: row.createdAt,
          items: []
        };
      }

      if (row.menuItemId) {
        ordersMap[row.orderId].items.push({
          menuItemId: row.menuItemId,
          name: row.itemName,
          quantity: row.quantity,
          specialInstructions: row.specialInstructions
        });
      }
    });

    const orders = Object.values(ordersMap);
    res.json({ success: true, orders });
  });
};
const updateOrderStatus = (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
   const role=req.user?.role;
    if (!role || !['Manager', 'Receptionist', 'Admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied: staff only' });
    }

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  const validStatuses = ['preparing', 'on the way', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const sql = `UPDATE restaurant_orders SET status = ? WHERE orderId = ?`;

  db.run(sql, [status, orderId], function (err) {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order status updated successfully' });
  });
};

module.exports = { getRestaurantMenu,placeRoomServiceOrder,getAllOrders,updateOrderStatus};
