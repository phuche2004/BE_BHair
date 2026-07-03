-- B-Hair Database Schema for SQLite
-- Migrated from MongoDB Atlas
-- Created: 2026-07-03

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone_number TEXT UNIQUE,
  password TEXT,
  email TEXT UNIQUE,
  google_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK(role IN ('ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER')),
  avatar TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  shop_id TEXT,
  fcm_token TEXT,
  -- Barber Profile (stored as JSON for flexibility)
  barber_profile TEXT, -- JSON: {bio, yearsExperience, specialties[], isActive}
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_shop ON users(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- Shops Table
-- ============================================
CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  gender TEXT DEFAULT 'MALE' CHECK(gender IN ('MALE', 'FEMALE', 'BOTH')),
  -- Location (GeoJSON style)
  location_type TEXT DEFAULT 'Point',
  location_longitude REAL NOT NULL, -- coordinates[0]
  location_latitude REAL NOT NULL,  -- coordinates[1]
  phone TEXT NOT NULL,
  images1 TEXT, -- JSON array of strings
  images2 TEXT, -- JSON array of strings
  images3 TEXT, -- JSON array of strings
  videos TEXT,  -- JSON array of strings
  manager_id TEXT,
  average_rating REAL DEFAULT 5.0,
  total_reviews INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  -- Subscription
  subscription_plan TEXT DEFAULT 'MONTHLY',
  subscription_expiry TEXT,
  is_paid INTEGER DEFAULT 0,
  -- Scheduling
  open_time TEXT DEFAULT '09:00',
  close_time TEXT DEFAULT '21:00',
  break_start TEXT,
  break_end TEXT,
  slot_duration INTEGER DEFAULT 30,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for shops
CREATE INDEX IF NOT EXISTS idx_shops_manager ON shops(manager_id);
CREATE INDEX IF NOT EXISTS idx_shops_location ON shops(location_latitude, location_longitude);
CREATE INDEX IF NOT EXISTS idx_shops_name ON shops(name);
CREATE INDEX IF NOT EXISTS idx_shops_is_active ON shops(is_active);

-- ============================================
-- Services Table
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL CHECK(price >= 0),
  manager_extra_fee REAL DEFAULT 0 CHECK(manager_extra_fee >= 0),
  duration INTEGER NOT NULL CHECK(duration >= 1), -- minutes
  image TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- Indexes for services
CREATE INDEX IF NOT EXISTS idx_services_shop ON services(shop_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- ============================================
-- Appointments Table
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  barber_id TEXT,
  service_ids TEXT NOT NULL, -- JSON array of service IDs
  booking_date TEXT NOT NULL, -- ISO 8601 datetime
  end_time TEXT NOT NULL,     -- ISO 8601 datetime
  total_price REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  booking_code TEXT UNIQUE NOT NULL,
  note TEXT,
  service_changes TEXT, -- JSON array: [{action, serviceId, byName, byId, date}]
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_shop ON appointments(shop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber ON appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_booking_date ON appointments(booking_date);
CREATE INDEX IF NOT EXISTS idx_appointments_booking_code ON appointments(booking_code);

-- ============================================
-- Reviews Table
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  appointment_id TEXT UNIQUE NOT NULL,
  shop_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  barber_id TEXT,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (barber_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_appointment ON reviews(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_shop ON reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_barber ON reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ============================================
-- Notifications Table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL,
  sender_id TEXT,
  type TEXT NOT NULL CHECK(type IN ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_COMPLETED', 'SYSTEM')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT, -- JSON object
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- History Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS history_logs (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('CREATED_APPOINTMENT', 'UPDATED_STATUS', 'EDITED_SERVICES')),
  details TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for history_logs
CREATE INDEX IF NOT EXISTS idx_history_shop ON history_logs(shop_id);
CREATE INDEX IF NOT EXISTS idx_history_actor ON history_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_history_action ON history_logs(action);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history_logs(created_at);

-- ============================================
-- Triggers for auto-updating updated_at
-- ============================================
CREATE TRIGGER IF NOT EXISTS users_updated_at AFTER UPDATE ON users BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS shops_updated_at AFTER UPDATE ON shops BEGIN
  UPDATE shops SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS services_updated_at AFTER UPDATE ON services BEGIN
  UPDATE services SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS appointments_updated_at AFTER UPDATE ON appointments BEGIN
  UPDATE appointments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================
-- Views for common queries
-- ============================================

-- View: Upcoming appointments with full details
CREATE VIEW IF NOT EXISTS v_upcoming_appointments AS
SELECT 
  a.id,
  a.booking_code,
  a.booking_date,
  a.end_time,
  a.status,
  a.total_price,
  a.note,
  s.name as shop_name,
  s.address as shop_address,
  u_customer.full_name as customer_name,
  u_customer.phone_number as customer_phone,
  u_barber.full_name as barber_name
FROM appointments a
JOIN shops s ON a.shop_id = s.id
LEFT JOIN users u_customer ON a.customer_id = u_customer.id
LEFT JOIN users u_barber ON a.barber_id = u_barber.id
WHERE a.status IN ('PENDING', 'CONFIRMED')
  AND datetime(a.booking_date) >= datetime('now')
ORDER BY a.booking_date ASC;

-- View: Shop statistics
CREATE VIEW IF NOT EXISTS v_shop_stats AS
SELECT 
  s.id,
  s.name,
  s.address,
  s.average_rating,
  s.total_reviews,
  COUNT(DISTINCT a.id) as total_appointments,
  COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN a.id END) as completed_appointments,
  COUNT(DISTINCT CASE WHEN a.status = 'CANCELLED' THEN a.id END) as cancelled_appointments,
  SUM(CASE WHEN a.status = 'COMPLETED' THEN a.total_price ELSE 0 END) as total_revenue
FROM shops s
LEFT JOIN appointments a ON s.id = a.shop_id
GROUP BY s.id;

-- ============================================
-- Optimization: Enable WAL mode for better concurrency
-- ============================================
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 30000000000;
PRAGMA page_size = 4096;

-- ============================================
-- Database initialized successfully
-- ============================================
