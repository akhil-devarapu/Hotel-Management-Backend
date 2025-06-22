const db = require('../config/database');

exports.getStaffSchedule = (req, res) => {
    const { date, department } = req.query;
    const role=req.user?.role;
    if (!role || ! ['Admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied: staff only' });
    }

    let query = `
        SELECT s.employeeId, s.name, s.department, sch.shift, sch.timing, sch.status
        FROM staff_schedule sch
        JOIN staff s ON s.employeeId = sch.employeeId
        WHERE 1=1
    `;
    const params = [];

    if (date) {
        query += ' AND sch.date = ?';
        params.push(date);
    }

    if (department) {
        query += ' AND s.department = ?';
        params.push(department);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching staff schedule:', err.message);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        res.json({
            success: true,
            schedule: rows
        });
    });
};
exports.markAttendance = (req, res) => {
  const { employeeId, date, status, shift, timing } = req.body;
  const role=req.user?.role;
    if (!role || !['Admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied: staff only' });
    }
  if (!employeeId || !date || !status) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const sql = `
    INSERT INTO staff_schedule (employeeId, date, shift, timing, status)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [employeeId, date, shift, timing, status], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Failed to record attendance" });
    }

    res.json({ success: true, message: "Attendance recorded successfully" });
  });
};