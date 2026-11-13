-- Review/apply only on an approved deployment, after 0001. Not run here.
ALTER TABLE organizations ADD COLUMN owner_id varchar REFERENCES users(id);
ALTER TABLE food_listings ADD COLUMN organization_id varchar REFERENCES organizations(id);
ALTER TABLE food_listings ADD COLUMN weight_kg real;
