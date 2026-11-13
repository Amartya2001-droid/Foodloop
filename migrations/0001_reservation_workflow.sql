-- Apply only to an approved existing PostgreSQL deployment, never automatically.
-- Review/back up existing data first. No hosted database was used in development.
ALTER TABLE claims ADD COLUMN claimer_id varchar REFERENCES users(id);
ALTER TABLE claims ADD COLUMN pickup_at timestamp;
ALTER TABLE claims ADD COLUMN expires_at timestamp;
ALTER TABLE claims ADD COLUMN pickup_notes text;
ALTER TABLE claims ADD COLUMN completed_at timestamp;
CREATE UNIQUE INDEX one_active_reservation_per_listing ON claims (listing_id)
  WHERE status IN ('reserved', 'picked_up');
