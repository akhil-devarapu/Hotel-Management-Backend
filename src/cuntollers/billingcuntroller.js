// cuntollers/billingController.js
const db = require('../config/database');

const getGuestBill = async (req, res) => {
  const { bookingId } = req.params;

  const bookingSql = `SELECT b.*, g.firstName, g.lastName FROM bookings b 
                      JOIN guests g ON b.guestId = g.id 
                      WHERE b.bookingId = ?`;

  db.get(bookingSql, [bookingId], (err, booking) => {
    if (err || !booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const nights = Math.ceil(
      (new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24)
    );

    const roomCharges = Array.from({ length: nights }, (_, i) => {
      const date = new Date(booking.checkInDate);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        rate: booking.totalAmount / nights,
        amount: booking.totalAmount / nights
      };
    });

    const restaurantSql = `SELECT * FROM restaurant_orders WHERE roomNumber = ?`;
    db.all(restaurantSql, [booking.roomNumber], (err, restaurantOrders) => {
      const restaurantCharges = restaurantOrders.map(order => ({
        date: order.createdAt?.split('T')[0] || "2024-03-26",
        orderId: order.orderId,
        amount: order.totalAmount
      }));

      const servicesSql = `SELECT * FROM additional_services WHERE bookingId = ?`;
      db.all(servicesSql, [bookingId], (err, services = []) => {
        const additionalServices = services.map(s => ({
          service: s.service,
          amount: s.amount
        }));

        const subtotal = booking.totalAmount +
                         restaurantCharges.reduce((sum, o) => sum + o.amount, 0) +
                         additionalServices.reduce((sum, s) => sum + s.amount, 0);

        const taxes = {
          cgst: parseFloat((subtotal * 0.09).toFixed(2)),
          sgst: parseFloat((subtotal * 0.09).toFixed(2))
        };

        const totalAmount = parseFloat((subtotal + taxes.cgst + taxes.sgst).toFixed(2));

        const payments = [
          {
            date: booking.checkInDate,
            amount: booking.advancePaid || 0,
            method: "Card"
          }
        ];

        const balanceDue = totalAmount - (booking.advancePaid || 0);

        return res.json({
          success: true,
          bill: {
            bookingId: booking.bookingId,
            guestName: `${booking.firstName} ${booking.lastName}`,
            roomNumber: booking.roomNumber,
            checkIn: booking.checkInDate,
            checkOut: booking.checkOutDate,
            roomCharges,
            restaurantCharges,
            additionalServices,
            subtotal,
            taxes,
            totalAmount,
            payments,
            balanceDue
          }
        });
      });
    });
  });
};
const processPayment = (req, res) => {
    if (!db) {
        return res.status(500).json({ success: false, message: "Database not initialized" });
    }

    const { bookingId, amount, paymentMethod, paymentDetails } = req.body;

    if (!bookingId || !amount || !paymentMethod || !paymentDetails) {
        return res.status(400).json({ success: false, message: "Missing payment data" });
    }

    const date = new Date().toISOString().split('T')[0];

    const insertPaymentQuery = `
        INSERT INTO payments (bookingId, date, amount, method, cardLastFour, transactionId)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(insertPaymentQuery, [
        bookingId,
        date,
        amount,
        paymentMethod,
        paymentDetails.cardLastFour || null,
        paymentDetails.transactionId || null
    ], function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: "Failed to record payment", error: err.message });
        }

        const updateBookingQuery = `
            UPDATE bookings
            SET balanceAmount = balanceAmount - ?
            WHERE bookingId = ?
        `;

        db.run(updateBookingQuery, [amount, bookingId], function (err2) {
            if (err2) {
                return res.status(500).json({ success: false, message: "Failed to update booking balance", error: err2.message });
            }

            return res.json({
                success: true,
                message: "Payment processed successfully",
                payment: {
                    bookingId,
                    amount,
                    method: paymentMethod,
                    date,
                    transactionId: paymentDetails.transactionId || null
                }
            });
        });
    });
};


module.exports = { getGuestBill,processPayment };
