import { supabase } from '../../../lib/supabase/client'
import type { WorkoutExerciseRow } from '../types'

export async function fetchAnalyticsData(): Promise<{
  data: { rows: WorkoutExerciseRow[]; workouts: { completed_at: string | null }[] } | null
  error: string | null
}> {
  const [weRes, workoutsRes] = await Promise.all([
    supabase
      .from('workout_exercises')
      .select('id, exercise_id, exercise_name_snapshot, muscle_group_snapshot, workout_id, workout_sets(weight_kg, reps), workouts!inner(completed_at)')
      .not('workouts.completed_at', 'is', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('workouts')
      .select('completed_at')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true }),
  ])

  if (weRes.error) return { data: null, error: weRes.error.message }
  if (workoutsRes.error) return { data: null, error: workoutsRes.error.message }

  const rows: WorkoutExerciseRow[] = (weRes.data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    exercise_id: r.exercise_id as string | null,
    exercise_name_snapshot: r.exercise_name_snapshot as string,
    muscle_group_snapshot: r.muscle_group_snapshot as string,
    workout_id: r.workout_id as string,
    workout_sets: r.workout_sets as { weight_kg: number; reps: number }[],
    workouts: r.workouts as { completed_at: string },
  }))

  return { data: { rows, workouts: workoutsRes.data ?? [] }, error: null }
}
