const db = require('../config/database');

exports.getInventory = (req, res) => {
  const { category, lowStock } = req.query;

  let query = 'SELECT *, CASE WHEN currentStock < reorderPoint THEN "low" ELSE "ok" END as status FROM inventory WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (lowStock === 'true') {
    query += ' AND currentStock < reorderPoint';
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching inventory:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
    }

    return res.json({
      success: true,
      inventory: rows
    });
  });
};
exports.recordInventoryUsage = (req, res) => {
  const { roomNumber, items } = req.body;

  if (!roomNumber || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid request body' });
  }

  const stmt = db.prepare(
    `INSERT INTO inventory_usage (itemId, roomNumber, quantity, reason) VALUES (?, ?, ?, ?)`
  );

  db.serialize(() => {
    for (const item of items) {
      if (!item.itemId || !item.quantity) continue;

      stmt.run([item.itemId, roomNumber, item.quantity, item.reason || null], (err) => {
        if (err) {
          console.error('Error recording inventory usage:', err);
        }
      });

      // Optional: Reduce stock in inventory
      db.run(
        `UPDATE inventory SET currentStock = currentStock - ? WHERE id = ?`,
        [item.quantity, item.itemId],
        (err) => {
          if (err) {
            console.error('Error updating inventory stock:', err);
          }
        }
      );
    }

    stmt.finalize(() => {
      res.json({ success: true, message: 'Inventory usage recorded successfully' });
    });
  });
};
