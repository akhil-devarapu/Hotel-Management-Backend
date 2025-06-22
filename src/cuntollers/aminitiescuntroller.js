const moment = require('moment');
const db=require('../config/database')
exports.getSpaAvailability = (req, res) => {
  const { date, service } = req.query;
  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required' });
  }

  const slots = [
    "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM",
    "04:00 PM", "05:00 PM", "06:00 PM"
  ];

  const availableSlots = [];

  const checkSlot = (index) => {
    if (index >= slots.length) {
      return res.json({ success: true, slots: availableSlots });
    }

    const time = slots[index];
    db.get(
      `SELECT therapist, status FROM spa_appointments WHERE date = ? AND time = ? ${service ? 'AND service = ?' : ''}`,
      service ? [date, time, service] : [date, time],
      (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        if (!result) {
          availableSlots.push({ time, available: true, therapist: "Available" });
        } else {
          availableSlots.push({
            time,
            available: result.status !== 'booked',
            therapist: result.status === 'booked' ? 'Booked' : result.therapist
          });
        }

        checkSlot(index + 1);
      }
    );
  };

  checkSlot(0);
};
exports.bookSpaAppointment = (req, res) => {
  const { roomNumber, service, date, time, duration, therapistPreference } = req.body;

  if (!roomNumber || !service || !date || !time || !duration) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  // For now, we assign a dummy therapist or use the preference if it's not 'any'
  const therapist = therapistPreference !== 'any' ? therapistPreference : 'John Doe';

  const sql = `
    INSERT INTO spa_appointments (date, time, therapist, service, status)
    VALUES (?, ?, ?, ?, 'booked')
  `;

  db.run(sql, [date, time, therapist, service], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Failed to book appointment" });
    }

    res.json({
      success: true,
      message: "Spa appointment booked successfully",
      appointment: {
        id: this.lastID,
        roomNumber,
        service,
        date,
        time,
        duration,
        therapist,
        status: 'booked'
      }
    });
  });
};