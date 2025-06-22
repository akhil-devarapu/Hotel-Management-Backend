const db = require('../config/database')

exports.createServiceRequest = (req, res) => {
  const { roomNumber, type, priority, description, preferredTime } = req.body;

  if (!roomNumber || !type || !priority || !description) {
    return res.status(400).json({ success: false, message: "All required fields must be filled." });
  }

  const sql = `
    INSERT INTO service_requests (roomNumber, type, priority, description, preferredTime, status, createdAt)
    VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
  `;

  db.run(sql, [roomNumber, type, priority, description, preferredTime], function (err) {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ success: false, message: "Failed to submit request" });
    }

    res.json({
      success: true,
      message: "Request submitted successfully",
      request: {
        id: this.lastID,
        roomNumber,
        type,
        priority,
        description,
        preferredTime,
        status: "pending",
        createdAt: new Date().toISOString()
      }
    });
  });
};
// controllers/requestController.js

exports.getAllRequests = (req, res) => {
  const { status, type, priority } = req.query;
  const role=req.user?.role;
    if (!role || !['Manager', 'Receptionist', 'Admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied: staff only' });
    }

  let query = `SELECT * FROM service_requests WHERE 1=1`;
  const params = [];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }

  if (priority) {
    query += ` AND priority = ?`;
    params.push(priority);
  }

  query += ` ORDER BY createdAt DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching service requests:', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    res.json({
      success: true,
      requests: rows
    });
  });
};
// controllers/requestController.js

exports.resolveRequest = (req, res) => {
  const requestId = req.params.requestId;
  const { resolution, resolvedBy, cost } = req.body;

  const updateQuery = `
    UPDATE service_requests
    SET 
      resolution = ?,
      resolvedBy = ?,
      cost = ?,
      status = 'completed',
      resolvedAt = datetime('now')
    WHERE id = ?
  `;

  db.run(updateQuery, [resolution, resolvedBy, cost, requestId], function (err) {
    if (err) {
      console.error('Error resolving request:', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({
      success: true,
      message: 'Request resolved successfully'
    });
  });
};
