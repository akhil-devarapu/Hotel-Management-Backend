const db = require('../config/database');

const getGuestDetails = (req, res) => {
  const guestId = req.params.guestId;
const role=req.user?.role;
    if (!role || !['Manager', 'Receptionist', 'Admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied: staff only' });
    }
  const guestSql = `
    SELECT 
      id, 
      firstName || ' ' || lastName AS name, 
      email, 
      phone, 
      loyaltyPoints, 
      membershipTier, 
      roomPreference, 
      pillow, 
      newspaper 
    FROM guests 
    WHERE id = ?
  `;

  db.get(guestSql, [guestId], (err, guest) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error', error: err.message });
    if (!guest) return res.status(404).json({ success: false, message: 'Guest not found' });

    const bookingSql = `
      SELECT 
        roomNumber, 
        checkInDate as checkIn, 
        checkOutDate as checkOut 
      FROM bookings 
      WHERE guestId = ? AND status IN ('confirmed', 'active') 
      ORDER BY checkInDate DESC 
      LIMIT 1
    `;

    db.get(bookingSql, [guestId], (err, booking) => {
      if (err) return res.status(500).json({ success: false, message: 'Booking fetch error', error: err.message });

      const response = {
        success: true,
        guest: {
          ...guest,
          preferences: {
            roomPreference: guest.roomPreference,
            pillow: guest.pillow,
            newspaper: guest.newspaper
          },
          currentBooking: booking || null
        }
      };

      delete response.guest.roomPreference;
      delete response.guest.pillow;
      delete response.guest.newspaper;

      res.json(response);
    });
  });
};
const updateGuestPreferences = (req, res) => {
  const { guestId } = req.params;
  const { roomPreference, pillow, newspaper } = req.body;

  if (!roomPreference && !pillow && !newspaper) {
    return res.status(400).json({ success: false, message: "At least one preference field is required" });
  }

  const sql = `
    UPDATE guests 
    SET 
      roomPreference = COALESCE(?, roomPreference),
      pillow = COALESCE(?, pillow),
      newspaper = COALESCE(?, newspaper)
    WHERE id = ?
  `;

  db.run(sql, [roomPreference, pillow, newspaper, guestId], function (err) {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }

    res.status(200).json({ success: true, message: 'Preferences updated successfully' });
  });
};

const getGuestHistory = (req, res) => {
  const { guestId } = req.params;

  const sql = `
    SELECT 
      bookingId,
      roomNumber,
      checkInDate,
      checkOutDate,
      totalAmount,
      status
    FROM bookings
    WHERE guestId = ? AND status = 'completed'
    ORDER BY checkOutDate DESC
  `;

  db.all(sql, [guestId], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No completed bookings found for this guest' });
    }

    res.status(200).json({
      success: true,
      history: rows
    });
  });
};

module.exports = { getGuestDetails,updateGuestPreferences,getGuestHistory };
