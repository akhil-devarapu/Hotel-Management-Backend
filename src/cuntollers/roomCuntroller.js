const  db = require('../config/database');
const { authenticateStaff } = require('../middleware/authmiddleware');
const getAllRooms = (req, res) => {
  const { status, type, floor, priceMin, priceMax } = req.query;
  let query = 'SELECT * FROM rooms WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (floor) {
    query += ' AND floor = ?';
    params.push(parseInt(floor));
  }
  if (priceMin) {
    query += ' AND pricePerNight >= ?';
    params.push(parseFloat(priceMin));
  }
  if (priceMax) {
    query += ' AND pricePerNight <= ?';
    params.push(parseFloat(priceMax));
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    const rooms = rows.map(room => ({
      ...room,
      amenities: room.amenities ? room.amenities.split(',') : []
    }));

    res.json({ success: true, rooms });
  });
};
const dayjs = require('dayjs');

const checkRoomAvailability = (req, res) => {
  const { checkIn, checkOut, roomType, guests } = req.query;
  if (!checkIn || !checkOut || !guests) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  const nights = dayjs(checkOut).diff(dayjs(checkIn), 'day');
  if (nights <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid date range' });
  }

  let query = `
    SELECT * FROM rooms
    WHERE maxOccupancy >= ?
      AND status = 'available'
  `;
  const params = [parseInt(guests)];

  if (roomType) {
    query += ' AND type = ?';
    params.push(roomType);
  }

  db.all(query, params, (err, rooms) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    const checkAvailable = (room, callback) => {
      db.get(
        `SELECT 1 FROM bookings
         WHERE roomNumber = ?
           AND status = 'confirmed'
           AND NOT (
             checkOutDate <= ? OR checkInDate >= ?
           )`,
        [room.roomNumber, checkIn, checkOut],
        (err, row) => {
          callback(!row); // true if no conflicting booking
        }
      );
    };

    const availableRooms = [];
    let processed = 0;

    rooms.forEach((room) => {
      checkAvailable(room, (isAvailable) => {
        if (isAvailable) {
          availableRooms.push({
            roomNumber: room.roomNumber,
            type: room.type,
            pricePerNight: room.pricePerNight,
            totalPrice: room.pricePerNight * nights,
            nights,
            amenities: room.amenities ? room.amenities.split(',') : []
          });
        }

        processed++;
        if (processed === rooms.length) {
          res.json({ success: true, availableRooms });
        }
      });
    });

    if (rooms.length === 0) {
      res.json({ success: true, availableRooms: [] });
    }
  });
};
const updateRoomStatus = (req, res) => {
  const { roomId } = req.params;
  const { status, reason, expectedAvailableDate } = req.body;

  // ✅ Check auth using middleware manually
  authenticateStaff(req, res, () => {
    const role=req.user?.role;
    if (!role || !['Manager', 'Receptionist', 'Admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied: staff only' });
    }
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const sql = `
      UPDATE rooms
      SET status = ?, maintenanceReason = ?, expectedAvailableDate = ?
      WHERE id = ?
    `;

    db.run(sql, [status, reason || null, expectedAvailableDate || null, roomId], function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }

      return res.json({
        success: true,
        message: `Room status updated to '${status}'`,
        roomId: roomId
      });
    });
  });
};

module.exports = {
  getAllRooms,
  checkRoomAvailability,
  updateRoomStatus
};

