-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  join_code text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Add group_id to submissions
ALTER TABLE submissions ADD COLUMN group_id uuid REFERENCES groups(id);

-- Drop old unique constraint on user_id if it exists
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_user_id_key;

-- Add new unique constraint: one name per group
ALTER TABLE submissions ADD CONSTRAINT submissions_group_name_unique UNIQUE (group_id, name);

-- Index for fast lookups by join code
CREATE INDEX IF NOT EXISTS idx_groups_join_code ON groups(join_code);

-- Index for fast lookups by group_id on submissions
CREATE INDEX IF NOT EXISTS idx_submissions_group_id ON submissions(group_id);
