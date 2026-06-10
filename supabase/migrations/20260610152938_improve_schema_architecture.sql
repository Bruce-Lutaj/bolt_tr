/*
# Improve Gym Tracker Schema Architecture

1. Add soft-delete (archived_at) and is_custom to exercises
2. Add started_at to workouts
3. Create workout_exercises intermediary table with name/muscle_group snapshots
4. Migrate existing workout_sets data through workout_exercises
5. Add constraints and indexes
6. Preserve all existing workout history
*/

-- 1. Add new columns to exercises
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 2. Add started_at to workouts
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now();

-- 3. Create workout_exercises table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_name_snapshot text NOT NULL,
  muscle_group_snapshot text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_workout_exercises" ON workout_exercises FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_workout_exercises" ON workout_exercises FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_workout_exercises" ON workout_exercises FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_workout_exercises" ON workout_exercises FOR DELETE
  TO anon, authenticated USING (true);

-- 4. Migrate existing workout_sets data into workout_exercises
INSERT INTO workout_exercises (workout_id, exercise_id, exercise_name_snapshot, muscle_group_snapshot, position)
SELECT DISTINCT ON (ws.workout_id, ws.exercise_id)
  ws.workout_id,
  ws.exercise_id,
  e.name,
  e.muscle_group,
  ROW_NUMBER() OVER (PARTITION BY ws.workout_id ORDER BY MIN(ws.set_number)) AS position
FROM workout_sets ws
JOIN exercises e ON e.id = ws.exercise_id
GROUP BY ws.workout_id, ws.exercise_id, e.name, e.muscle_group;

-- 5. Add workout_exercise_id to workout_sets and populate it
ALTER TABLE workout_sets ADD COLUMN workout_exercise_id uuid REFERENCES workout_exercises(id) ON DELETE CASCADE;

UPDATE workout_sets ws
SET workout_exercise_id = we.id
FROM workout_exercises we
WHERE we.workout_id = ws.workout_id AND we.exercise_id = ws.exercise_id;

-- 6. Make workout_exercise_id NOT NULL now that it's populated
ALTER TABLE workout_sets ALTER COLUMN workout_exercise_id SET NOT NULL;

-- 7. Drop old columns from workout_sets
ALTER TABLE workout_sets DROP COLUMN workout_id;
ALTER TABLE workout_sets DROP COLUMN exercise_id;

-- 8. Rename weight to weight_kg and change type
ALTER TABLE workout_sets RENAME COLUMN weight TO weight_kg;
ALTER TABLE workout_sets ALTER COLUMN weight_kg TYPE numeric(6,2);

-- 9. Add check constraints
ALTER TABLE workout_sets ADD CONSTRAINT workout_sets_reps_positive CHECK (reps > 0);
ALTER TABLE workout_sets ADD CONSTRAINT workout_sets_weight_non_negative CHECK (weight_kg >= 0);
ALTER TABLE workout_sets ADD CONSTRAINT workout_sets_set_number_positive CHECK (set_number > 0);
ALTER TABLE workout_exercises ADD CONSTRAINT workout_exercises_position_positive CHECK (position > 0);

-- 10. Add indexes
CREATE INDEX IF NOT EXISTS workout_exercises_workout_id_idx ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS workout_exercises_exercise_id_idx ON workout_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS workout_sets_workout_exercise_id_idx ON workout_sets(workout_exercise_id);
CREATE INDEX IF NOT EXISTS exercises_archived_at_idx ON exercises(archived_at);

-- 11. Drop old indexes that are no longer relevant
DROP INDEX IF EXISTS idx_workout_sets_workout_id;
DROP INDEX IF EXISTS idx_workout_sets_exercise_id;