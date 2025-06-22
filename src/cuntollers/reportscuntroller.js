const db = require('../config/database');
const dayjs = require('dayjs');

exports.getOccupancyReport = (req, res) => {
  const { startDate, endDate } = req.query;
   const role=req.user?.role;
    if (!role || !['Manager'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied: Manager only' });
    }


  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
  }

  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const days = end.diff(start, 'day') + 1;

  if (days <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid date range' });
  }

  // Step 1: Get total rooms
  db.get(`SELECT COUNT(*) as totalRooms FROM rooms`, (err, roomResult) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error', error: err });

    const totalRooms = roomResult.totalRooms;
    const totalRoomNights = totalRooms * days;

    // Step 2: Get occupied nights from bookings
    db.all(
      `
      SELECT checkInDate, checkOutDate FROM bookings
      WHERE 
        (checkInDate <= ? AND checkOutDate >= ?)
        AND status IN ('confirmed', 'active', 'checked-in')
      `,
      [endDate, startDate],
      (err, bookings) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error', error: err });

        let occupiedRoomNights = 0;
        const dailyOccupancyMap = {};

        for (let d = 0; d < days; d++) {
          const currentDate = start.add(d, 'day').format('YYYY-MM-DD');
          dailyOccupancyMap[currentDate] = { occupied: 0, available: totalRooms };
        }

        bookings.forEach(({ checkInDate, checkOutDate }) => {
          let current = dayjs(checkInDate).isBefore(start) ? start : dayjs(checkInDate);
          const checkOut = dayjs(checkOutDate);

          while (current.isBefore(checkOut) && current.isBefore(end.add(1, 'day'))) {
            const day = current.format('YYYY-MM-DD');
            if (dailyOccupancyMap[day]) {
              dailyOccupancyMap[day].occupied += 1;
              dailyOccupancyMap[day].available -= 1;
              occupiedRoomNights += 1;
            }
            current = current.add(1, 'day');
          }
        });

        const dailyOccupancy = Object.keys(dailyOccupancyMap).map(date => {
          const entry = dailyOccupancyMap[date];
          const occupancy = ((entry.occupied / totalRooms) * 100).toFixed(0) + '%';
          return { date, occupancy, occupied: entry.occupied, available: entry.available };
        });

        const averageOccupancy = ((occupiedRoomNights / totalRoomNights) * 100).toFixed(0) + '%';

        res.json({
          success: true,
          report: {
            period: `${startDate} to ${endDate}`,
            averageOccupancy,
            totalRoomNights,
            occupiedRoomNights,
            dailyOccupancy
          }
        });
      }
    );
  });
};
exports.getRevenueReport = (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
  }

  const report = {
    period: `${startDate} to ${endDate}`,
    totalRevenue: 0,
    roomRevenue: 0,
    restaurantRevenue: 0,
    paymentBreakdown: {}
  };

  // Get room revenue from payments
  db.all(
    `SELECT amount, method FROM payments WHERE date BETWEEN ? AND ?`,
    [startDate, endDate],
    (err, payments) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      payments.forEach(({ amount, method }) => {
        report.roomRevenue += amount;
        report.paymentBreakdown[method] = (report.paymentBreakdown[method] || 0) + amount;
      });

      // Get restaurant revenue from restaurant_orders
      db.all(
        `SELECT totalAmount FROM restaurant_orders WHERE createdAt BETWEEN ? AND ?`,
        [startDate, endDate],
        (err2, orders) => {
          if (err2) return res.status(500).json({ success: false, error: err2.message });

          orders.forEach(order => {
            report.restaurantRevenue += order.totalAmount;
          });

          report.totalRevenue = report.roomRevenue + report.restaurantRevenue;

          return res.json({ success: true, report });
        }
      );
    }
  );
};
const moment = require('moment');

exports.getOccupancyReport = (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
  }

  db.get(`SELECT COUNT(*) AS totalRooms FROM rooms`, (err, roomResult) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    const totalRooms = roomResult.totalRooms;
    const start = moment(startDate);
    const end = moment(endDate);
    const days = end.diff(start, 'days') + 1;

    const dailyOccupancy = [];
    let occupiedRoomNights = 0;

    const processNextDay = (currentDate) => {
      if (currentDate.isAfter(end)) {
        const totalRoomNights = days * totalRooms;
        const avgOccupancy = ((occupiedRoomNights / totalRoomNights) * 100).toFixed(0) + '%';

        return res.json({
          success: true,
          report: {
            period: `${startDate} to ${endDate}`,
            averageOccupancy: avgOccupancy,
            totalRoomNights,
            occupiedRoomNights,
            dailyOccupancy
          }
        });
      }

      const dateStr = currentDate.format('YYYY-MM-DD');
      db.get(
        `SELECT COUNT(*) AS occupied FROM bookings 
         WHERE status IN ('confirmed', 'active') 
         AND date(?) BETWEEN checkInDate AND checkOutDate`,
        [dateStr],
        (err2, result) => {
          if (err2) return res.status(500).json({ success: false, error: err2.message });

          const occupied = result.occupied;
          occupiedRoomNights += occupied;

          dailyOccupancy.push({
            date: dateStr,
            occupancy: `${((occupied / totalRooms) * 100).toFixed(0)}%`,
            occupied,
            available: totalRooms - occupied
          });

          processNextDay(currentDate.add(1, 'day'));
        }
      );
    };

    processNextDay(start.clone());
  });
};
