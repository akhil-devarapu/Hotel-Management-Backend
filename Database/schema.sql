-- database/schema.sql
-- Clean old data for dev


CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employeeId TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL, -- e.g., Manager, Receptionist, Housekeeping
  password TEXT NOT NULL -- hashed password using bcrypt
);
CREATE TABLE IF NOT EXISTS guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  dateOfBirth TEXT NOT NULL,
  loyaltyPoints INTEGER DEFAULT 0,
  membershipTier TEXT DEFAULT 'Bronze'
);
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roomNumber TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,                -- Single, Double, Suite, Deluxe
  floor INTEGER NOT NULL,
  status TEXT NOT NULL,              -- available, occupied, maintenance
  pricePerNight REAL NOT NULL,
  maxOccupancy INTEGER NOT NULL,
  amenities TEXT,                    -- Stored as comma-separated string
  view TEXT,
  size TEXT,
  lastCleaned TEXT                   -- ISO date string
);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bookingId TEXT UNIQUE,
  guestId INTEGER,
  roomNumber TEXT NOT NULL,
  checkInDate TEXT NOT NULL,
  checkOutDate TEXT NOT NULL,
  adults INTEGER,
  children INTEGER,
  specialRequests TEXT,
  totalAmount REAL,
  advancePaid REAL,
  balanceAmount REAL,
  status TEXT DEFAULT 'confirmed'
);
CREATE TABLE IF NOT EXISTS restaurant_menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  description TEXT,
  price REAL,
  vegetarian BOOLEAN,
  available BOOLEAN,
  preparationTime INTEGER,
  category TEXT -- e.g., breakfast, lunch, dinner, beverages, snacks
);
CREATE TABLE IF NOT EXISTS restaurant_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT,
    menuItemId INTEGER,
    quantity INTEGER,
    specialInstructions TEXT,
    FOREIGN KEY (menuItemId) REFERENCES restaurant_menu(id),
    FOREIGN KEY (orderId) REFERENCES restaurant_orders(orderId)
);
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookingId TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL,         -- e.g., Cash, Card, UPI
    paymentDate TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bookingId) REFERENCES bookings(bookingId)
);
CREATE TABLE IF NOT EXISTS additional_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookingId TEXT NOT NULL,
    service TEXT NOT NULL,        -- e.g., Laundry, Spa, etc.
    amount REAL NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bookingId) REFERENCES bookings(bookingId)
);
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookingId TEXT,
    date TEXT,
    amount REAL,
    method TEXT,
    cardLastFour TEXT,
    transactionId TEXT,
    FOREIGN KEY (bookingId) REFERENCES bookings(bookingId) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,           -- linens/toiletries/minibar/maintenance
  currentStock INTEGER NOT NULL,
  reorderPoint INTEGER NOT NULL,
  unit TEXT NOT NULL,               -- e.g., pieces, liters
  supplier TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inventory_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itemId INTEGER NOT NULL,
  roomNumber TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  usedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itemId) REFERENCES inventory(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS spa_appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,        -- Format: YYYY-MM-DD
  time TEXT NOT NULL,        -- Format: "10:00 AM"
  therapist TEXT NOT NULL,
  service TEXT NOT NULL,
  status TEXT DEFAULT 'booked'  -- booked / cancelled
);
CREATE TABLE IF NOT EXISTS service_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roomNumber TEXT NOT NULL,
  type TEXT NOT NULL,            -- maintenance, service, complaint
  priority TEXT DEFAULT 'medium',-- low, medium, high, urgent
  description TEXT NOT NULL,
  preferredTime TEXT,
  status TEXT DEFAULT 'pending', -- pending, in-progress, resolved
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS staff_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    shift TEXT NOT NULL, -- Morning, Afternoon, Night
    timing TEXT NOT NULL, -- "06:00 AM - 02:00 PM"
    status TEXT DEFAULT 'scheduled', -- present, absent, leave, scheduled
    FOREIGN KEY (employeeId) REFERENCES staff(employeeId)
);
CREATE TABLE IF NOT EXISTS housekeeping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  roomId INTEGER NOT NULL,
  type TEXT NOT NULL,                      -- e.g., "checkout-cleaning"
  status TEXT DEFAULT 'pending',           -- "pending", "in-progress", "completed"
  priority TEXT DEFAULT 'medium',          -- "low", "medium", "high"
  assignedTo TEXT,
  scheduledDate TEXT NOT NULL,             -- e.g. "2025-06-21"
  scheduledTime TEXT,                      -- e.g. "11:00 AM"
  specialInstructions TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (roomId) REFERENCES rooms(id)
);
