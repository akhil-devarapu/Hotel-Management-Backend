const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const  db = require('../config/database');

const registerStaff = async (req, res) => {
  const { employeeId, name, department, role, password } = req.body;
  if (!employeeId || !name || !department || !role || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = `INSERT INTO staff (employeeId, name, department, role, password) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [employeeId, name, department, role, hashedPassword], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ success: false, message: 'Employee ID already exists' });
      }
      return res.status(500).json({ success: false, message: err.message });
    }

    res.status(201).json({
      success: true,
      message: 'Staff registered successfully',
      staff: {
        id: this.lastID,
        employeeId,
        name,
        department,
        role
      }
    });
  });
};

const loginStaff = (req, res) => {
  const { employeeId, password } = req.body;
  if (!employeeId || !password) {
    return res.status(400).json({ success: false, message: 'Employee ID and password required' });
  }

  db.get(`SELECT * FROM staff WHERE employeeId = ?`, [employeeId], async (err, row) => {
    if (err || !row) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, row.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const payload = { id: row.id, employeeId: row.employeeId, role: row.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      success: true,
      token,
      staff: {
        id: row.id,
        employeeId: row.employeeId,
        name: row.name,
        role: row.role,
        department: row.department
      }
    });
  });
};
const registerGuest = async (req, res) => {
  const { firstName, lastName, email, phone, password, dateOfBirth } = req.body;

  if (!firstName || !lastName || !email || !phone || !password || !dateOfBirth) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `
    INSERT INTO guests (firstName, lastName, email, phone, password, dateOfBirth)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [firstName, lastName, email, phone, hashedPassword, dateOfBirth], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }
      return res.status(500).json({ success: false, message: err.message });
    }

    res.status(201).json({
      success: true,
      message: 'Guest registered successfully',
      guest: {
        id: this.lastID,
        firstName,
        lastName
      }
    });
  });
};


module.exports = { registerStaff, loginStaff,registerGuest };
