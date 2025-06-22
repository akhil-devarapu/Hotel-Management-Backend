CREATE TABLE IF NOT EXISTS housekeeping_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roomNumber TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., "regular", "deep", "urgent"
    items TEXT, -- Comma-separated list like: "Extra towels,Toiletries refill"
    preferredTime TEXT, -- Format: "14:00"
    status TEXT DEFAULT 'pending', -- pending, in-progress, completed
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS housekeeping_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roomNumber TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., "regular", "deep", "urgent"
    items TEXT, -- Comma-separated list like: "Extra towels,Toiletries refill"
    preferredTime TEXT, -- Format: "14:00"
    status TEXT DEFAULT 'pending', -- pending, in-progress, completed
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
