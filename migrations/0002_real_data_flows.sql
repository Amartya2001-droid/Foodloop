-- Review/apply only on an approved deployment, after 0001. Not run here.
ALTER TABLE organizations ADD COLUMN owner_id varchar REFERENCES users(id);
ALTER TABLE food_listings ADD COLUMN organization_id varchar REFERENCES organizations(id);
ALTER TABLE food_listings ADD COLUMN weight_kg real;
-- Legacy rows have no established provenance and must not be relabeled as real telemetry.
ALTER TABLE sensor_data ADD COLUMN source text NOT NULL DEFAULT 'unknown';
ALTER TABLE sensor_data ADD COLUMN recorded_by varchar REFERENCES users(id);
