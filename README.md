# 🏨 Hotel Management Backend API

A complete backend solution for hotel operations, built with **Node.js**, **Express**, and **SQLite**. This project handles guest management, bookings, housekeeping, restaurant orders, billing, inventory, staff scheduling, and more — designed to reflect real-world hotel operations.
## 🚀 Features

### 🔐 Authentication
- Staff and guest login using **JWT tokens**
- Role-based access control (`Admin`, `Manager`, `Receptionist`, `Housekeeping`, `Guest`)

### 🛏️ Room Management
- Room creation with filters (status, type, floor, price)
- Availability checking by date range and occupancy
- Status updates (maintenance, occupied, available)

### 📅 Bookings
- Guest booking with room allocation and price calculation
- Check-in and check-out processing
- Booking history and real-time status tracking

### 💵 Billing System
- Room + restaurant + additional charges per guest
- Automatic tax calculation (CGST & SGST)
- Payment tracking (partial and full)
- Downloadable and itemized bill details

### 🧹 Housekeeping
- Daily schedule with status updates
- Priority and time slot management
- Room-specific service requests (extra towels, toiletries)
- Cleaning status update API

### 🍽️ Restaurant Service
- Menu filtering (category, veg/non-veg, availability)
- Room service order placing & status tracking
- Restaurant order management for staff

### 📦 Inventory Management
- Track inventory items (linens, toiletries, minibar)
- Reorder point alerts and low stock filters
- Record room usage with reasons

### 💆‍♀️ Spa & Amenities
- Spa slot availability API
- Bookings for specific services and therapists

### 📣 Complaints & Requests
- Service or maintenance request creation by guests/staff
- Resolution tracking and cost logging

### 👨‍💼 Staff Management (Admin only)
- Staff schedule by department and shift
- Attendance logging per staff per day

### 📊 Reports
- Occupancy report with daily room stats
- Revenue report across bookings, restaurant, and services

---

## 🧰 Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite3
- **Authentication**: JSON Web Tokens (JWT)
- **Testing**: Postman
- **Version Control**: Git & GitHub

---

## 📁 Project Structure
hotel-management-backend/
│
├── src/
│ ├── controllers/
│ ├── routes/
│ ├── middleware/
│ ├── config/
│ └── app.js
│
├── database/
│ ├── schema.sql
│ └── seed.sql
├── .env
├── .gitignore
├── README.md


---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/akhil-devarapu/Hotel-Management-Backend.git
cd Hotel-Management-Backend
📮 Sample API Categories
Module	Endpoint Examples
Auth	POST /api/auth/staff/login
Rooms	GET /api/rooms, GET /api/rooms/availability
Bookings	POST /api/bookings/create, PUT /checkin
Billing	GET /api/bills/:bookingId
Housekeeping	GET /api/housekeeping/schedule
Restaurant	POST /api/restaurant/order
Inventory	GET /api/inventory, POST /api/inventory/usage
Reports	GET /api/reports/revenue, occupancy

🙌 Author
Akhil Devarapu
📧 akhilchowdarydevarapu@gmail.com
