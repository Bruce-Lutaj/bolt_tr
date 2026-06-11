/*
  # Add Accounts Table, Ownership, and Proper RLS

  1. Create `accounts` table linked to auth.users
  2. Add `account_id` to workouts and exercises
  3. Auto-create account row on user signup (trigger)
  4. Replace broad anon policies with proper per-user RLS
*/

-- 1. Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_account" ON accounts FOR SELECT
  TO authenticated USING (auth.uid() = id);
CREATE POLICY "update_own_account" ON accounts FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Add account_id to workouts
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS workouts_account_id_idx ON workouts(account_id);

-- 3. Add account_id to exercises (null = global/seeded exercise)
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS exercises_account_id_idx ON exercises(account_id);

-- 4. Trigger to auto-create account on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.accounts (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'display_name'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Drop old broad anon policies on exercises
DROP POLICY IF EXISTS "anon_select_exercises" ON exercises;
DROP POLICY IF EXISTS "anon_insert_exercises" ON exercises;
DROP POLICY IF EXISTS "anon_update_exercises" ON exercises;
DROP POLICY IF EXISTS "anon_delete_exercises" ON exercises;

-- New exercises policies
CREATE POLICY "select_exercises" ON exercises FOR SELECT
  TO authenticated USING (account_id IS NULL OR account_id = auth.uid());
CREATE POLICY "insert_own_exercises" ON exercises FOR INSERT
  TO authenticated WITH CHECK (account_id = auth.uid());
CREATE POLICY "update_own_exercises" ON exercises FOR UPDATE
  TO authenticated USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());
CREATE POLICY "delete_own_exercises" ON exercises FOR DELETE
  TO authenticated USING (account_id = auth.uid());

-- 6. Drop old broad anon policies on workouts
DROP POLICY IF EXISTS "anon_select_workouts" ON workouts;
DROP POLICY IF EXISTS "anon_insert_workouts" ON workouts;
DROP POLICY IF EXISTS "anon_update_workouts" ON workouts;
DROP POLICY IF EXISTS "anon_delete_workouts" ON workouts;

-- New workouts policies
CREATE POLICY "select_own_workouts" ON workouts FOR SELECT
  TO authenticated USING (account_id = auth.uid());
CREATE POLICY "insert_own_workouts" ON workouts FOR INSERT
  TO authenticated WITH CHECK (account_id = auth.uid());
CREATE POLICY "update_own_workouts" ON workouts FOR UPDATE
  TO authenticated USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());
CREATE POLICY "delete_own_workouts" ON workouts FOR DELETE
  TO authenticated USING (account_id = auth.uid());

-- 7. Drop old broad anon policies on workout_exercises
DROP POLICY IF EXISTS "anon_select_workout_exercises" ON workout_exercises;
DROP POLICY IF EXISTS "anon_insert_workout_exercises" ON workout_exercises;
DROP POLICY IF EXISTS "anon_update_workout_exercises" ON workout_exercises;
DROP POLICY IF EXISTS "anon_delete_workout_exercises" ON workout_exercises;

-- New workout_exercises policies (scoped through parent workout)
CREATE POLICY "select_own_workout_exercises" ON workout_exercises FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.account_id = auth.uid())
  );
CREATE POLICY "insert_own_workout_exercises" ON workout_exercises FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.account_id = auth.uid())
  );
CREATE POLICY "update_own_workout_exercises" ON workout_exercises FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.account_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.account_id = auth.uid())
  );
CREATE POLICY "delete_own_workout_exercises" ON workout_exercises FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.account_id = auth.uid())
  );

-- 8. Drop old broad anon policies on workout_sets
DROP POLICY IF EXISTS "anon_select_workout_sets" ON workout_sets;
DROP POLICY IF EXISTS "anon_insert_workout_sets" ON workout_sets;
DROP POLICY IF EXISTS "anon_update_workout_sets" ON workout_sets;
DROP POLICY IF EXISTS "anon_delete_workout_sets" ON workout_sets;

-- New workout_sets policies (scoped through grandparent workout)
CREATE POLICY "select_own_workout_sets" ON workout_sets FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE we.id = workout_exercise_id AND w.account_id = auth.uid()
    )
  );
CREATE POLICY "insert_own_workout_sets" ON workout_sets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE we.id = workout_exercise_id AND w.account_id = auth.uid()
    )
  );
CREATE POLICY "update_own_workout_sets" ON workout_sets FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE we.id = workout_exercise_id AND w.account_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE we.id = workout_exercise_id AND w.account_id = auth.uid()
    )
  );
CREATE POLICY "delete_own_workout_sets" ON workout_sets FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN workouts w ON w.id = we.workout_id
      WHERE we.id = workout_exercise_id AND w.account_id = auth.uid()
    )
  );
