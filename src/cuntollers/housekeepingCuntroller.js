const db = require('../config/database');

exports.getSchedule = (req, res) => {
  const { date, floor, status } = req.query;
  const today = new Date().toISOString().split('T')[0];

  let query = `
    SELECT h.id, r.roomNumber, h.type, h.status, h.priority, h.assignedTo,
           h.scheduledTime, h.specialInstructions
    FROM housekeeping h
    JOIN rooms r ON h.roomId = r.id
    WHERE h.scheduledDate = ?
  `;
  const params = [date || today];

  if (floor) {
    query += ` AND r.floor = ?`;
    params.push(floor);
  }

  if (status) {
    query += ` AND h.status = ?`;
    params.push(status);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch housekeeping schedule' });
    }

    res.json({ success: true, schedule: rows });
  });
};
exports.createRequest = (req, res) => {
    const { roomNumber, type, items, preferredTime } = req.body;

    if (!roomNumber || !type || !preferredTime) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const itemsString = Array.isArray(items) ? items.join(', ') : '';

    const query = `
        INSERT INTO housekeeping_requests (roomNumber, type, items, preferredTime)
        VALUES (?, ?, ?, ?)
    `;

    db.run(query, [roomNumber, type, itemsString, preferredTime], function (err) {
        if (err) {
            console.error("Error inserting housekeeping request:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        return res.status(201).json({
            success: true,
            message: "Housekeeping request submitted successfully",
            requestId: this.lastID
        });
    });
};

exports.updateStatus = (req, res) => {
    const { taskId } = req.params;
    const { status, completedAt, notes } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: "Status is required" });
    }

    const query = `
        UPDATE housekeeping
        SET status = ?, 
            completedAt = ?, 
            notes = ?, 
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.run(query, [status, completedAt || null, notes || null, taskId], function (err) {
        if (err) {
            console.error("Failed to update housekeeping status:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Housekeeping status updated successfully"
        });
    });
};
