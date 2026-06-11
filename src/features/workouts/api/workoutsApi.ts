import { supabase } from '../../../lib/supabase/client'
import type { Workout, WorkoutWithExercises, DraftExercise } from '../types'

export async function fetchRecentWorkouts(limit = 3): Promise<{ data: Workout[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(limit)

  return { data: data as Workout[] | null, error: error?.message ?? null }
}

export async function fetchTotalWorkoutCount(): Promise<{ data: number; error: string | null }> {
  const { count, error } = await supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .not('completed_at', 'is', null)

  return { data: count ?? 0, error: error?.message ?? null }
}

export async function fetchWeeklyWorkoutCount(): Promise<{ data: number; error: string | null }> {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { count, error } = await supabase
    .from('workouts')
    .select('id', { count: 'exact', head: true })
    .not('completed_at', 'is', null)
    .gte('completed_at', weekAgo.toISOString())

  return { data: count ?? 0, error: error?.message ?? null }
}

export async function fetchTotalVolume(): Promise<{ data: number; error: string | null }> {
  const { data, error } = await supabase
    .from('workout_sets')
    .select('reps, weight_kg')

  if (error) return { data: 0, error: error.message }
  const rows = data as { reps: number; weight_kg: number }[] | null
  const volume = (rows ?? []).reduce((sum, s) => sum + s.reps * s.weight_kg, 0)
  return { data: volume, error: null }
}

export async function fetchWorkoutById(id: string): Promise<{ data: WorkoutWithExercises | null; error: string | null }> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*, workout_exercises(*, workout_sets(*))')
    .eq('id', id)
    .maybeSingle()

  return { data: data as WorkoutWithExercises | null, error: error?.message ?? null }
}

interface RepeatExerciseRow {
  exercise_id: string | null
  exercise_name_snapshot: string
  muscle_group_snapshot: string
  position: number
  workout_sets: { set_number: number; reps: number; weight_kg: number }[]
}

export async function fetchWorkoutForRepeat(workoutId: string): Promise<{ data: RepeatExerciseRow[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('exercise_id, exercise_name_snapshot, muscle_group_snapshot, position, workout_sets(set_number, reps, weight_kg)')
    .eq('workout_id', workoutId)
    .order('position')

  return { data: data as RepeatExerciseRow[] | null, error: error?.message ?? null }
}

interface WorkoutRow {
  id: string
  name: string
  completed_at: string | null
  workout_exercises: { id: string; workout_sets: { reps: number; weight_kg: number }[] }[]
}

export async function fetchAllWorkoutsWithSets(): Promise<{ data: { id: string; completed_at: string; exerciseCount: number; setCount: number; volume: number; name: string }[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*, workout_exercises(id, workout_sets(reps, weight_kg))')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  const rows = data as unknown as WorkoutRow[]
  const mapped = (rows ?? []).map((w) => {
    const exs = w.workout_exercises
    const exerciseCount = exs?.length ?? 0
    const setCount = exs ? exs.reduce((sum, we) => sum + we.workout_sets.length, 0) : 0
    const volume = exs
      ? exs.reduce((sum, we) => sum + we.workout_sets.reduce((s, set) => s + set.reps * set.weight_kg, 0), 0)
      : 0
    return { id: w.id, completed_at: w.completed_at!, exerciseCount, setCount, volume, name: w.name }
  })

  return { data: mapped, error: null }
}

export async function createWorkout(name: string, startedAt: string, entries: DraftExercise[]): Promise<{ data: { id: string } | null; error: string | null }> {
  const validEntries = entries.filter(
    (entry) => entry.sets.some((s) => s.reps !== '' && s.weight !== '')
  )

  if (validEntries.length === 0) {
    return { data: null, error: 'No valid sets to save' }
  }

  const now = new Date().toISOString()

  const { data: workout, error: workoutErr } = await supabase
    .from('workouts')
    .insert({ name, started_at: startedAt, completed_at: now })
    .select()
    .single()

  if (workoutErr || !workout) {
    return { data: null, error: workoutErr?.message ?? 'Failed to create workout' }
  }

  const workoutId = (workout as { id: string }).id

  const workoutExercises = validEntries.map((entry, idx) => ({
    workout_id: workoutId,
    exercise_id: entry.exercise.id ?? null,
    exercise_name_snapshot: entry.exercise.name,
    muscle_group_snapshot: entry.exercise.muscle_group,
    position: idx + 1,
  }))

  const { data: insertedExercises, error: exErr } = await supabase
    .from('workout_exercises')
    .insert(workoutExercises)
    .select()

  if (exErr || !insertedExercises) {
    await supabase.from('workouts').delete().eq('id', workoutId)
    return { data: null, error: exErr?.message ?? 'Failed to save exercises' }
  }

  const sets = validEntries.flatMap((entry, entryIdx) => {
    const workoutExercise = insertedExercises[entryIdx] as { id: string }
    return entry.sets
      .filter((s) => s.reps !== '' && s.weight !== '')
      .map((s, idx) => ({
        workout_exercise_id: workoutExercise.id,
        set_number: idx + 1,
        reps: parseInt(s.reps) || 1,
        weight_kg: parseFloat(s.weight) || 0,
      }))
  })

  if (sets.length > 0) {
    const { error: setsErr } = await supabase.from('workout_sets').insert(sets)
    if (setsErr) {
      await supabase.from('workouts').delete().eq('id', workoutId)
      return { data: null, error: setsErr.message }
    }
  }

  return { data: { id: workoutId }, error: null }
}

export async function deleteWorkout(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('workouts').delete().eq('id', id)
  return { error: error?.message ?? null }
}
