/*
# Create Gym Tracker Schema

1. New Tables
   - `exercises`
     - `id` (uuid, primary key)
     - `name` (text, not null)
     - `muscle_group` (text, not null)
     - `created_at` (timestamp)
   - `workouts`
     - `id` (uuid, primary key)
     - `name` (text, not null)
     - `completed_at` (timestamp, nullable - set when workout is finished)
     - `created_at` (timestamp)
   - `workout_sets`
     - `id` (uuid, primary key)
     - `workout_id` (uuid, FK to workouts)
     - `exercise_id` (uuid, FK to exercises)
     - `set_number` (integer, not null)
     - `reps` (integer, not null)
     - `weight` (numeric, not null - in kg)
     - `created_at` (timestamp)

2. Security
   - Enable RLS on all tables.
   - Allow anon + authenticated full CRUD (single-tenant, no auth required).

3. Seed Data
   - Common gym exercises across major muscle groups.

4. Notes
   - Single-tenant design: no user_id columns, no auth required.
   - Weight stored in kg; frontend handles display preference.
*/

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_exercises" ON exercises;
CREATE POLICY "anon_select_exercises" ON exercises FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_exercises" ON exercises;
CREATE POLICY "anon_insert_exercises" ON exercises FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_exercises" ON exercises;
CREATE POLICY "anon_update_exercises" ON exercises FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_exercises" ON exercises;
CREATE POLICY "anon_delete_exercises" ON exercises FOR DELETE
  TO anon, authenticated USING (true);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_workouts" ON workouts;
CREATE POLICY "anon_select_workouts" ON workouts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_workouts" ON workouts;
CREATE POLICY "anon_insert_workouts" ON workouts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_workouts" ON workouts;
CREATE POLICY "anon_update_workouts" ON workouts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_workouts" ON workouts;
CREATE POLICY "anon_delete_workouts" ON workouts FOR DELETE
  TO anon, authenticated USING (true);

-- Workout Sets table
CREATE TABLE IF NOT EXISTS workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL,
  reps integer NOT NULL,
  weight numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_workout_sets" ON workout_sets;
CREATE POLICY "anon_select_workout_sets" ON workout_sets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_workout_sets" ON workout_sets;
CREATE POLICY "anon_insert_workout_sets" ON workout_sets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_workout_sets" ON workout_sets;
CREATE POLICY "anon_update_workout_sets" ON workout_sets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_workout_sets" ON workout_sets;
CREATE POLICY "anon_delete_workout_sets" ON workout_sets FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workout_sets_workout_id ON workout_sets(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON workout_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workouts_completed_at ON workouts(completed_at);

-- Seed common exercises
INSERT INTO exercises (name, muscle_group) VALUES
  ('Bench Press', 'Chest'),
  ('Incline Dumbbell Press', 'Chest'),
  ('Cable Flyes', 'Chest'),
  ('Push Ups', 'Chest'),
  ('Barbell Squat', 'Legs'),
  ('Leg Press', 'Legs'),
  ('Romanian Deadlift', 'Legs'),
  ('Leg Extension', 'Legs'),
  ('Leg Curl', 'Legs'),
  ('Calf Raises', 'Legs'),
  ('Deadlift', 'Back'),
  ('Pull Ups', 'Back'),
  ('Barbell Row', 'Back'),
  ('Lat Pulldown', 'Back'),
  ('Seated Cable Row', 'Back'),
  ('Overhead Press', 'Shoulders'),
  ('Lateral Raises', 'Shoulders'),
  ('Front Raises', 'Shoulders'),
  ('Face Pulls', 'Shoulders'),
  ('Barbell Curl', 'Arms'),
  ('Dumbbell Curl', 'Arms'),
  ('Tricep Pushdown', 'Arms'),
  ('Skull Crushers', 'Arms'),
  ('Hammer Curl', 'Arms'),
  ('Plank', 'Core'),
  ('Crunches', 'Core'),
  ('Hanging Leg Raises', 'Core'),
  ('Russian Twists', 'Core')
ON CONFLICT DO NOTHING;