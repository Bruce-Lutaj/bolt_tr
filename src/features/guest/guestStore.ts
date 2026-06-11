import type { Workout, WorkoutWithExercises, DraftExercise } from '../workouts/types'

const WORKOUTS_KEY = 'gymtrack.guest.workouts'

export function isGuestMode(): boolean {
  return localStorage.getItem('gymtrack.authMode') === 'guest'
}

interface StoredWorkout extends WorkoutWithExercises {
  account_id: string
}

function readWorkouts(): StoredWorkout[] {
  const raw = localStorage.getItem(WORKOUTS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as StoredWorkout[]
  } catch {
    return []
  }
}

function writeWorkouts(workouts: StoredWorkout[]): void {
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts))
}

export function guestFetchRecentWorkouts(limit = 3): { data: Workout[] | null; error: string | null } {
  const all = readWorkouts()
    .filter((w) => w.completed_at !== null)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, limit)

  const data: Workout[] = all.map(({ id, name, started_at, completed_at, created_at }) => ({
    id, name, started_at, completed_at, created_at,
  }))

  return { data, error: null }
}

export function guestFetchTotalWorkoutCount(): { data: number; error: string | null } {
  const count = readWorkouts().filter((w) => w.completed_at !== null).length
  return { data: count, error: null }
}

export function guestFetchWeeklyWorkoutCount(): { data: number; error: string | null } {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const count = readWorkouts().filter(
    (w) => w.completed_at !== null && new Date(w.completed_at).getTime() >= weekAgo.getTime()
  ).length
  return { data: count, error: null }
}

export function guestFetchTotalVolume(): { data: number; error: string | null } {
  const workouts = readWorkouts().filter((w) => w.completed_at !== null)
  let volume = 0
  for (const w of workouts) {
    for (const we of w.workout_exercises) {
      for (const s of we.workout_sets) {
        volume += s.reps * s.weight_kg
      }
    }
  }
  return { data: volume, error: null }
}

export function guestFetchWorkoutById(id: string): { data: WorkoutWithExercises | null; error: string | null } {
  const workout = readWorkouts().find((w) => w.id === id)
  return { data: workout ?? null, error: null }
}

export function guestFetchWorkoutForRepeat(workoutId: string): {
  data: { exercise_id: string | null; exercise_name_snapshot: string; muscle_group_snapshot: string; position: number; workout_sets: { set_number: number; reps: number; weight_kg: number }[] }[] | null
  error: string | null
} {
  const workout = readWorkouts().find((w) => w.id === workoutId)
  if (!workout) return { data: null, error: null }

  const rows = workout.workout_exercises
    .sort((a, b) => a.position - b.position)
    .map((we) => ({
      exercise_id: we.exercise_id,
      exercise_name_snapshot: we.exercise_name_snapshot,
      muscle_group_snapshot: we.muscle_group_snapshot,
      position: we.position,
      workout_sets: we.workout_sets.map((s) => ({
        set_number: s.set_number,
        reps: s.reps,
        weight_kg: s.weight_kg,
      })),
    }))

  return { data: rows, error: null }
}

export function guestFetchAllWorkoutsWithSets(): {
  data: { id: string; completed_at: string; exerciseCount: number; setCount: number; volume: number; name: string }[] | null
  error: string | null
} {
  const workouts = readWorkouts()
    .filter((w) => w.completed_at !== null)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())

  const mapped = workouts.map((w) => {
    const exerciseCount = w.workout_exercises.length
    const setCount = w.workout_exercises.reduce((sum, we) => sum + we.workout_sets.length, 0)
    const volume = w.workout_exercises.reduce(
      (sum, we) => sum + we.workout_sets.reduce((s, set) => s + set.reps * set.weight_kg, 0), 0
    )
    return { id: w.id, completed_at: w.completed_at!, exerciseCount, setCount, volume, name: w.name }
  })

  return { data: mapped, error: null }
}

export function guestCreateWorkout(
  name: string,
  startedAt: string,
  entries: DraftExercise[]
): { data: { id: string } | null; error: string | null } {
  const validEntries = entries.filter(
    (entry) => entry.sets.some((s) => s.reps !== '' && s.weight !== '')
  )

  if (validEntries.length === 0) {
    return { data: null, error: 'No valid sets to save' }
  }

  const now = new Date().toISOString()
  const workoutId = crypto.randomUUID()

  const workoutExercises = validEntries.map((entry, idx) => {
    const weId = crypto.randomUUID()
    const sets = entry.sets
      .filter((s) => s.reps !== '' && s.weight !== '')
      .map((s, sIdx) => ({
        id: crypto.randomUUID(),
        workout_exercise_id: weId,
        set_number: sIdx + 1,
        reps: parseInt(s.reps) || 1,
        weight_kg: parseFloat(s.weight) || 0,
        created_at: now,
      }))

    return {
      id: weId,
      workout_id: workoutId,
      exercise_id: entry.exercise.id,
      exercise_name_snapshot: entry.exercise.name,
      muscle_group_snapshot: entry.exercise.muscle_group,
      position: idx + 1,
      created_at: now,
      workout_sets: sets,
    }
  })

  const workout: StoredWorkout = {
    id: workoutId,
    name,
    started_at: startedAt,
    completed_at: now,
    created_at: now,
    account_id: 'guest',
    workout_exercises: workoutExercises,
  }

  const existing = readWorkouts()
  existing.push(workout)
  writeWorkouts(existing)

  return { data: { id: workoutId }, error: null }
}

export function guestDeleteWorkout(id: string): { error: string | null } {
  const existing = readWorkouts()
  const filtered = existing.filter((w) => w.id !== id)
  writeWorkouts(filtered)
  return { error: null }
}
