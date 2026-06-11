import { supabase } from '../../../lib/supabase/client'
import { isGuestMode } from '../../guest/guestStore'
import { isSmartUserMode, suFetchAnalyticsData } from '../../smartuser/smartUserStore'
import type { WorkoutExerciseRow } from '../types'

function guestFetchAnalyticsData(): {
  data: { rows: WorkoutExerciseRow[]; workouts: { completed_at: string | null }[] } | null
  error: string | null
} {
  const raw = localStorage.getItem('gymtrack.guest.workouts')
  if (!raw) return { data: { rows: [], workouts: [] }, error: null }

  try {
    const workouts = JSON.parse(raw) as {
      id: string
      completed_at: string | null
      workout_exercises: {
        id: string
        exercise_id: string | null
        exercise_name_snapshot: string
        muscle_group_snapshot: string
        workout_id: string
        workout_sets: { reps: number; weight_kg: number }[]
      }[]
    }[]

    const completed = workouts.filter((w) => w.completed_at !== null)
    const rows: WorkoutExerciseRow[] = completed.flatMap((w) =>
      w.workout_exercises.map((we) => ({
        id: we.id,
        exercise_id: we.exercise_id,
        exercise_name_snapshot: we.exercise_name_snapshot,
        muscle_group_snapshot: we.muscle_group_snapshot,
        workout_id: w.id,
        workout_sets: we.workout_sets,
        workouts: { completed_at: w.completed_at! },
      }))
    )

    const workoutDates = completed.map((w) => ({ completed_at: w.completed_at }))
    return { data: { rows, workouts: workoutDates }, error: null }
  } catch {
    return { data: { rows: [], workouts: [] }, error: null }
  }
}

export async function fetchAnalyticsData(): Promise<{
  data: { rows: WorkoutExerciseRow[]; workouts: { completed_at: string | null }[] } | null
  error: string | null
}> {
  if (isGuestMode()) return guestFetchAnalyticsData()
  if (isSmartUserMode()) return suFetchAnalyticsData()

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
