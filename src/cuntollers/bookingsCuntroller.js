const db = require('../config/database');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');

// Helper to generate custom booking ID
const generateBookingId = () => {
  const now = dayjs();
  return `BK${now.format('YYYYMMDD')}${Math.floor(1000 + Math.random() * 9000)}`;
};

const createBooking = (req, res) => {
  const { guestDetails, bookingDetails } = req.body;
  const {
    firstName, lastName, email, phone, idType, idNumber
  } = guestDetails;

  const {
    checkInDate, checkOutDate, roomType, numberOfRooms,
    adults, children, specialRequests
  } = bookingDetails;

  if (!checkInDate || !checkOutDate || !roomType || !numberOfRooms || !adults) {
    return res.status(400).json({ success: false, message: 'Missing booking details' });
  }

  const nights = dayjs(checkOutDate).diff(dayjs(checkInDate), 'day');
  if (nights <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid date range' });
  }

  // Step 1: Insert or find guest
  db.get(`SELECT id FROM guests WHERE email = ?`, [email], (err, guest) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    const insertOrContinue = (guestId) => {
      // Step 2: Find available room
      const roomQuery = `
        SELECT * FROM rooms WHERE type = ? AND status = 'available'
        AND roomNumber NOT IN (
          SELECT roomNumber FROM bookings
          WHERE status = 'confirmed' AND NOT (checkOutDate <= ? OR checkInDate >= ?)
        )
        LIMIT ?
      `;

      db.all(roomQuery, [roomType, checkInDate, checkOutDate, numberOfRooms], (err, rooms) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!rooms || rooms.length < numberOfRooms) {
          return res.status(400).json({ success: false, message: 'No available room(s)' });
        }

        const selectedRoom = rooms[0];
        const bookingId = generateBookingId();
        const totalAmount = selectedRoom.pricePerNight * nights;
        const advancePaid = totalAmount * 0.33;
        const balanceAmount = totalAmount - advancePaid;

        // Step 3: Insert booking
        const insertBooking = `
          INSERT INTO bookings (
            bookingId, guestId, roomNumber, checkInDate, checkOutDate,
            adults, children, specialRequests,
            totalAmount, advancePaid, balanceAmount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(insertBooking, [
          bookingId, guestId, selectedRoom.roomNumber,
          checkInDate, checkOutDate, adults, children || 0, specialRequests || '',
          totalAmount, advancePaid, balanceAmount
        ], function (err) {
          if (err) return res.status(500).json({ success: false, message: err.message });

          // Mark room as occupied
          db.run(`UPDATE rooms SET status = 'occupied' WHERE roomNumber = ?`, [selectedRoom.roomNumber]);

          res.status(201).json({
            success: true,
            booking: {
              bookingId,
              status: 'confirmed',
              roomNumber: selectedRoom.roomNumber,
              checkIn: checkInDate,
              checkOut: checkOutDate,
              totalAmount,
              advancePaid,
              balanceAmount
            }
          });
        });
      });
    };

    if (guest) {
      insertOrContinue(guest.id);
    } else {
      const guestInsert = `
        INSERT INTO guests (firstName, lastName, email, phone, idType, idNumber)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.run(guestInsert, [firstName, lastName, email, phone, idType, idNumber], function (err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        insertOrContinue(this.lastID);
      });
    }
  });
};
const getAllBookings = (req, res) => {
  const { status, date, guestName } = req.query;
  const role=req.user?.role;
    if (!role || !['Manager', 'Receptionist', 'Admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied: staff only' });
    }

  let query = `
    SELECT b.bookingId, b.roomNumber, b.checkInDate, b.checkOutDate, b.status,
           b.totalAmount, b.advancePaid, b.balanceAmount,
           g.firstName || ' ' || g.lastName AS guestName
    FROM bookings b
    JOIN guests g ON b.guestId = g.id
    WHERE 1 = 1
  `;
  const params = [];

  if (guestName) {
    query += ` AND (g.firstName || ' ' || g.lastName) LIKE ?`;
    params.push(`%${guestName}%`);
  }

  if (date) {
    query += ` AND (b.checkInDate = ? OR b.checkOutDate = ?)`;
    params.push(date, date);
  }

  if (status) {
    const today = dayjs().format('YYYY-MM-DD');
    switch (status) {
      case 'upcoming':
        query += ` AND b.checkInDate > ?`;
        params.push(today);
        break;
      case 'active':
        query += ` AND b.checkInDate <= ? AND b.checkOutDate > ?`;
        params.push(today, today);
        break;
      case 'completed':
        query += ` AND b.checkOutDate <= ?`;
        params.push(today);
        break;
      case 'cancelled':
        query += ` AND b.status = 'cancelled'`;
        break;
      default:
        break;
    }
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    const bookings = rows.map(row => ({
      bookingId: row.bookingId,
      guestName: row.guestName,
      roomNumber: row.roomNumber,
      checkIn: row.checkInDate,
      checkOut: row.checkOutDate,
      status: row.status,
      totalAmount: row.totalAmount,
      paymentStatus:
        row.balanceAmount === 0 ? 'paid'
        : row.advancePaid > 0 ? 'partial'
        : 'unpaid'
    }));

    res.json({ success: true, bookings });
  });
};
const checkInBooking = (req, res) => {
  const { bookingId } = req.params;
  const { roomNumber, actualArrivalTime, numberOfGuests, idVerified } = req.body;
   const role=req.user?.role;
    if (!role || !['Manager', 'Receptionist', 'Admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied: staff only' });
    }


  const { adults, children } = numberOfGuests || {};

  if (!roomNumber || !actualArrivalTime || typeof idVerified !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Missing required check-in details' });
  }

  // Make sure booking exists and is confirmed
  const getBooking = `SELECT * FROM bookings WHERE bookingId = ? AND status = 'confirmed'`;

  db.get(getBooking, [bookingId], (err, booking) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or already checked in' });
    }

    // Update booking
    const update = `
      UPDATE bookings SET
        actualArrivalTime = ?,
        actualAdults = ?,
        actualChildren = ?,
        idVerified = ?,
        status = 'active'
      WHERE bookingId = ?
    `;

    db.run(update, [actualArrivalTime, adults || 0, children || 0, idVerified ? 1 : 0, bookingId], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });

      // Update room status to occupied
      db.run(`UPDATE rooms SET status = 'occupied' WHERE roomNumber = ?`, [roomNumber]);

      res.json({
        success: true,
        message: 'Check-in successful',
        bookingId,
        status: 'active',
        arrivalTime: actualArrivalTime
      });
    });
  });
};
const checkoutBooking = (req, res) => {
  const { bookingId } = req.params;
  const actualCheckoutTime = new Date().toISOString(); // Current time
   const role=req.user?.role;
    if (!role || !['Manager', 'Receptionist', 'Admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied: staff only' });
    }

  // Step 1: Get the booking
  const getBooking = `SELECT * FROM bookings WHERE bookingId = ? AND status = 'active'`;

  db.get(getBooking, [bookingId], (err, booking) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Active booking not found' });
    }

    // Step 2: Update booking status and actual checkout
    const updateBooking = `
      UPDATE bookings SET
        actualCheckoutTime = ?,
        status = 'completed'
      WHERE bookingId = ?
    `;

    db.run(updateBooking, [actualCheckoutTime, bookingId], function (err) {
      if (err) return res.status(500).json({ success: false, message: err.message });

      // Step 3: Set room to available
      db.run(`UPDATE rooms SET status = 'available' WHERE roomNumber = ?`, [booking.roomNumber], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        res.json({
          success: true,
          message: 'Check-out completed successfully',
          bookingId,
          roomNumber: booking.roomNumber,
          checkoutTime: actualCheckoutTime
        });
      });
    });
  });
};


module.exports = { createBooking,getAllBookings,checkInBooking,checkoutBooking};
