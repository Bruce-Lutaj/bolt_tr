/*
  # Fix workout_exercises INSERT/UPDATE policies

  The existing policies only check parent workout ownership.
  They must also verify that exercise_id is either null (no exercise ref),
  global (account_id IS NULL), or owned by auth.uid().
*/

-- Drop existing insert/update policies
DROP POLICY IF EXISTS "insert_own_workout_exercises" ON workout_exercises;
DROP POLICY IF EXISTS "update_own_workout_exercises" ON workout_exercises;

-- Recreate INSERT policy with exercise ownership check
CREATE POLICY "insert_own_workout_exercises" ON workout_exercises FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.account_id = auth.uid())
    AND (
      exercise_id IS NULL
      OR EXISTS (
        SELECT 1 FROM exercises e
        WHERE e.id = exercise_id AND (e.account_id IS NULL OR e.account_id = auth.uid())
      )
    )
  );

-- Recreate UPDATE policy with exercise ownership check
CREATE POLICY "update_own_workout_exercises" ON workout_exercises FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.account_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM workouts w WHERE w.id = workout_id AND w.account_id = auth.uid())
    AND (
      exercise_id IS NULL
      OR EXISTS (
        SELECT 1 FROM exercises e
        WHERE e.id = exercise_id AND (e.account_id IS NULL OR e.account_id = auth.uid())
      )
    )
  );
