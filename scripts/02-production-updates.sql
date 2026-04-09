-- Production updates for accurate live tracking, shuffle flow and final passcode storage
-- Safe to run multiple times (idempotent where possible).

BEGIN;

-- Ensure teams table has all required columns for live operations
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS question_order INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  ADD COLUMN IF NOT EXISTS shuffle_slot INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalty_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_time INTEGER DEFAULT 0;

-- Allow final stage state to be represented as level 6.
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_current_level_check;
ALTER TABLE teams
  ADD CONSTRAINT teams_current_level_check
  CHECK (current_level >= 1 AND current_level <= 6);

-- Add supporting index for admin/live ordering
CREATE INDEX IF NOT EXISTS idx_teams_current_level ON teams(current_level);
CREATE INDEX IF NOT EXISTS idx_teams_updated_at ON teams(updated_at DESC);

-- Final passcodes are now stored in DB (not hardcoded in API).
CREATE TABLE IF NOT EXISTS final_passcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passcode TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE final_passcodes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'final_passcodes'
      AND policyname = 'final_passcodes_select_policy'
  ) THEN
    CREATE POLICY final_passcodes_select_policy ON final_passcodes
      FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM final_passcodes
    WHERE upper(regexp_replace(passcode, '[^A-Za-z0-9_]', '', 'g')) =
          upper(regexp_replace('I''M NOT TIERD', '[^A-Za-z0-9_]', '', 'g'))
  ) THEN
    INSERT INTO final_passcodes (passcode, is_active) VALUES ('I''M NOT TIERD', true);
  END IF;
END $$;

-- Keep question_order sane for old rows.
UPDATE teams
SET question_order = ARRAY[1,2,3,4,5]
WHERE question_order IS NULL OR array_length(question_order, 1) <> 5;

-- Helpful view for admin panel and direct SQL monitoring.
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

COMMIT;

-- Optional: query for live status in Supabase SQL editor
-- SELECT * FROM admin_team_live ORDER BY completion_status DESC, current_level DESC, effective_time_seconds ASC;
