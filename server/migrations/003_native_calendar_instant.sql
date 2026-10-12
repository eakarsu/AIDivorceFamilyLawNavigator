-- Preserve every existing legacy wall-time value; exact instants are additive and server-owned.
BEGIN;
ALTER TABLE court_dates ADD COLUMN IF NOT EXISTS native_date_instant TIMESTAMPTZ;
COMMIT;
