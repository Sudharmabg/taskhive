-- Applied automatically on startup by config/SchemaFixes.java (and Hibernate for team_id);
-- kept here for the record. Safe to re-run.

-- Job roles are free text now (presets plus custom roles typed by an admin)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_job_role_check;
ALTER TABLE users ALTER COLUMN job_role TYPE VARCHAR(50);

-- Team that owns each Epic / Task / Bug
ALTER TABLE stories ADD COLUMN IF NOT EXISTS team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_stories_team_id ON stories(team_id);
