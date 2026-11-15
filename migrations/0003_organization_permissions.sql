-- Review only: apply to an approved deployment after 0001 and 0002.
-- No hosted database has been connected or migrated during development.
CREATE TABLE organization_memberships (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar NOT NULL REFERENCES organizations(id),
  user_id varchar NOT NULL REFERENCES users(id),
  role text NOT NULL CONSTRAINT organization_membership_role CHECK (role IN ('manager', 'member')),
  status text NOT NULL DEFAULT 'invited' CONSTRAINT organization_membership_status CHECK (status IN ('invited', 'active', 'declined', 'removed')),
  invited_by varchar NOT NULL REFERENCES users(id),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX organization_member_unique ON organization_memberships (organization_id, user_id);
CREATE TABLE organization_reviews (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id varchar NOT NULL REFERENCES organizations(id),
  requested_by varchar NOT NULL REFERENCES users(id),
  evidence text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CONSTRAINT organization_review_status CHECK (status IN ('pending', 'approved', 'rejected', 'superseded')),
  requested_at timestamp NOT NULL DEFAULT now(),
  reviewed_by varchar REFERENCES users(id),
  reviewed_at timestamp,
  note text
);
CREATE UNIQUE INDEX one_pending_organization_review ON organization_reviews (organization_id) WHERE status = 'pending';
-- Legacy organizations.verified flags have no review audit and the public API
-- deliberately treats them as unverified until an approved review is recorded.
