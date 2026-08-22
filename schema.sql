-- Pasing Wellness V0.5 / Cloudflare D1
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  treatment_minutes INTEGER NOT NULL,
  blocked_end_minute INTEGER NOT NULL,
  service_key TEXT NOT NULL,
  service_name TEXT NOT NULL,
  base_duration INTEGER NOT NULL,
  addon_ear_candles INTEGER NOT NULL DEFAULT 0,
  first_visit INTEGER NOT NULL DEFAULT 0,
  price_eur INTEGER NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_note TEXT,
  cancellation_token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
  cancelled_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings(date,status);
CREATE INDEX IF NOT EXISTS idx_bookings_cancel_token ON bookings(cancellation_token_hash);
