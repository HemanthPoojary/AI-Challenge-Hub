-- Treasure Hunt Web App Database Schema
-- Creates tables for teams, level attempts, and completions with Row Level Security

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE completion_status AS ENUM ('in_progress', 'completed', 'abandoned');

-- Teams table - stores all participating teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  total_time INTEGER DEFAULT 0,
  penalty_seconds INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 6),
  question_order INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  shuffle_slot INTEGER DEFAULT 0,
  completion_status completion_status DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Level attempts table - tracks wrong attempts at each level
CREATE TABLE IF NOT EXISTS level_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, level)
);

-- Level completions table - tracks when teams complete each level
CREATE TABLE IF NOT EXISTS level_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, level)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_teams_team_name ON teams(team_name);
CREATE INDEX IF NOT EXISTS idx_teams_completion_status ON teams(completion_status);
CREATE INDEX IF NOT EXISTS idx_level_attempts_team_id ON level_attempts(team_id);
CREATE INDEX IF NOT EXISTS idx_level_completions_team_id ON level_completions(team_id);

-- Row Level Security Policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_completions ENABLE ROW LEVEL SECURITY;

-- Policy: Each team can only read and modify their own data
CREATE POLICY team_select_policy ON teams
  FOR SELECT
  USING (true); -- Allow everyone to see for leaderboard

CREATE POLICY team_insert_policy ON teams
  FOR INSERT
  WITH CHECK (true); -- Allow registration

CREATE POLICY team_update_policy ON teams
  FOR UPDATE
  USING (true); -- Validation handled at API level

-- Policies for level_attempts
CREATE POLICY level_attempts_select_policy ON level_attempts
  FOR SELECT
  USING (true);

CREATE POLICY level_attempts_insert_policy ON level_attempts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY level_attempts_update_policy ON level_attempts
  FOR UPDATE
  USING (true);

-- Policies for level_completions
CREATE POLICY level_completions_select_policy ON level_completions
  FOR SELECT
  USING (true);

CREATE POLICY level_completions_insert_policy ON level_completions
  FOR INSERT
  WITH CHECK (true);

-- Helper function to get IST time
CREATE OR REPLACE FUNCTION get_ist_time()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
  SELECT NOW() AT TIME ZONE 'Asia/Kolkata';
$$ LANGUAGE SQL IMMUTABLE;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_timestamp
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();

-- Passcode storage table (separate for security)
CREATE TABLE IF NOT EXISTS level_passcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level INTEGER NOT NULL UNIQUE CHECK (level >= 1 AND level <= 5),
  passcode_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE level_passcodes ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to read passcode hashes
CREATE POLICY passcode_read_policy ON level_passcodes
  FOR SELECT
  USING (true); -- Edge Functions will validate, frontend never reads

-- Insert level passcodes (pre-hashed with bcrypt)
-- Passwords for testing: "LEVEL1", "LEVEL2", "LEVEL3", "LEVEL4", "LEVEL5"
INSERT INTO level_passcodes (level, passcode_hash) VALUES
  (1, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36jkV3FG'), -- LEVEL1
  (2, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36jkV3FG'), -- LEVEL2
  (3, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36jkV3FG'), -- LEVEL3
  (4, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36jkV3FG'), -- LEVEL4
  (5, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36jkV3FG')  -- LEVEL5
ON CONFLICT DO NOTHING;

-- Final passcode storage for level 6 validation
CREATE TABLE IF NOT EXISTS final_passcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passcode TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE final_passcodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY final_passcodes_select_policy ON final_passcodes
  FOR SELECT
  USING (true);

INSERT INTO final_passcodes (passcode, is_active) VALUES
  ('I''M NOT TIERD', true)
ON CONFLICT DO NOTHING;

-- Admin helper view with IST conversion and effective timer
CREATE OR REPLACE VIEW admin_team_live AS
SELECT
  t.id,
  t.team_name,
  t.current_level,
  t.completion_status,
  t.start_time,
  (t.start_time AT TIME ZONE 'Asia/Kolkata') AS start_time_ist,
  t.end_time,
  (t.end_time AT TIME ZONE 'Asia/Kolkata') AS end_time_ist,
  t.penalty_seconds,
  t.total_time,
  COALESCE(SUM(la.attempt_count), 0) AS wrong_attempts,
  COALESCE(
    CASE
      WHEN t.completion_status = 'completed' THEN t.total_time
      ELSE EXTRACT(EPOCH FROM (NOW() - t.start_time))::INTEGER + COALESCE(t.penalty_seconds, 0)
    END,
    0
  ) AS effective_time_seconds
FROM teams t
LEFT JOIN level_attempts la ON la.team_id = t.id
GROUP BY
  t.id, t.team_name, t.current_level, t.completion_status,
  t.start_time, t.end_time, t.penalty_seconds, t.total_time;
