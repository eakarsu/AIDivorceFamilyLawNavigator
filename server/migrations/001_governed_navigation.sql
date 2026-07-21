BEGIN;
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';

CREATE TABLE IF NOT EXISTS navigation_workspaces (
  id UUID PRIMARY KEY, name TEXT NOT NULL, created_by BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS navigation_memberships (
  workspace_id UUID NOT NULL REFERENCES navigation_workspaces(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL, role TEXT NOT NULL CHECK (role IN ('client','attorney','navigator','viewer')),
  PRIMARY KEY (workspace_id, user_id)
);
CREATE TABLE IF NOT EXISTS family_matters (
  id UUID PRIMARY KEY, workspace_id UUID NOT NULL REFERENCES navigation_workspaces(id) ON DELETE CASCADE,
  label TEXT NOT NULL, country_code CHAR(2) NOT NULL, jurisdiction_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'intake' CHECK (status IN ('intake','document_collection','attorney_review','filed','closed')),
  safety_status TEXT NOT NULL DEFAULT 'not_screened' CHECK (safety_status IN ('not_screened','no_disclosure','escalation_requested')),
  disclaimer_accepted_at TIMESTAMPTZ NOT NULL, created_by BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS jurisdiction_rules (
  id UUID PRIMARY KEY, workspace_id UUID NOT NULL REFERENCES navigation_workspaces(id) ON DELETE CASCADE,
  jurisdiction_code TEXT NOT NULL, rule_key TEXT NOT NULL, citation TEXT NOT NULL, source_url TEXT NOT NULL,
  effective_from DATE NOT NULL, effective_until DATE, day_count INTEGER CHECK (day_count BETWEEN 0 AND 3660),
  retrieved_at TIMESTAMPTZ NOT NULL, content_hash TEXT NOT NULL, entered_by BIGINT NOT NULL,
  UNIQUE (workspace_id, jurisdiction_code, rule_key, effective_from)
);
CREATE TABLE IF NOT EXISTS matter_facts (
  id UUID PRIMARY KEY, matter_id UUID NOT NULL REFERENCES family_matters(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES navigation_workspaces(id) ON DELETE CASCADE,
  fact_key TEXT NOT NULL, fact_value JSONB NOT NULL, source_document_id UUID, confirmed_by_client BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(matter_id, fact_key)
);
CREATE TABLE IF NOT EXISTS matter_documents (
  id UUID PRIMARY KEY, matter_id UUID NOT NULL REFERENCES family_matters(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES navigation_workspaces(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, storage_ref TEXT NOT NULL, sha256 CHAR(64) NOT NULL,
  authorization_basis TEXT NOT NULL, source_date DATE, uploaded_by BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (matter_id, sha256)
);
ALTER TABLE matter_facts DROP CONSTRAINT IF EXISTS matter_facts_source_document_id_fkey;
ALTER TABLE matter_facts ADD CONSTRAINT matter_facts_source_document_id_fkey FOREIGN KEY (source_document_id) REFERENCES matter_documents(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS matter_deadlines (
  id UUID PRIMARY KEY, matter_id UUID NOT NULL REFERENCES family_matters(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES navigation_workspaces(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES jurisdiction_rules(id), trigger_date DATE NOT NULL, due_date DATE NOT NULL,
  calculation_method TEXT NOT NULL, calendar_verified_by BIGINT, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','verified','completed','superseded')),
  created_by BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS option_explanations (
  id UUID PRIMARY KEY, matter_id UUID NOT NULL REFERENCES family_matters(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES navigation_workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL, plain_language TEXT NOT NULL, source_rule_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','attorney_reviewed','rejected')),
  professional_disclaimer TEXT NOT NULL, created_by BIGINT NOT NULL, reviewed_by BIGINT, review_note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS navigation_integration_jobs (
  id UUID PRIMARY KEY, workspace_id UUID NOT NULL REFERENCES navigation_workspaces(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES family_matters(id) ON DELETE CASCADE, provider TEXT NOT NULL, operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('queued','succeeded','failed','cancelled')),
  failure_code TEXT, failure_detail TEXT, created_by BIGINT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, provider, idempotency_key)
);
CREATE TABLE IF NOT EXISTS navigation_audit_events (
  id BIGSERIAL PRIMARY KEY, workspace_id UUID NOT NULL REFERENCES navigation_workspaces(id) ON DELETE CASCADE,
  actor_user_id BIGINT NOT NULL, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
  reason TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_family_matters_workspace ON family_matters(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_matter_deadlines_due ON matter_deadlines(workspace_id, due_date);
COMMIT;
