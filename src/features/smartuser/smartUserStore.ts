import type { Workout, WorkoutWithExercises, DraftExercise } from '../workouts/types'
import type { Exercise } from '../exercises/types'
import { getSmartUserId } from '../auth/api/smartUserAuthApi'

function prefix(): string {
  const id = getSmartUserId() ?? 'unknown'
  return `gymtrack.smartuser.${id}`
}

function workoutsKey(): string {
  return `${prefix()}.workouts`
}

function exercisesKey(): string {
  return `${prefix()}.exercises`
}

function archivedKey(): string {
  return `${prefix()}.archivedExercises`
}

export function isSmartUserMode(): boolean {
  return localStorage.getItem('gymtrack.authMode') === 'smartuser'
}

interface StoredWorkout extends WorkoutWithExercises {
  account_id: string
}

function readWorkouts(): StoredWorkout[] {
  const raw = localStorage.getItem(workoutsKey())
  if (!raw) return []
  try {
    return JSON.parse(raw) as StoredWorkout[]
  } catch {
    return []
  }
}

function writeWorkouts(workouts: StoredWorkout[]): void {
  localStorage.setItem(workoutsKey(), JSON.stringify(workouts))
}

export function suFetchRecentWorkouts(limit = 3): { data: Workout[] | null; error: string | null } {
  const all = readWorkouts()
    .filter((w) => w.completed_at !== null)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, limit)

  const data: Workout[] = all.map(({ id, name, started_at, completed_at, created_at }) => ({
    id, name, started_at, completed_at, created_at,
  }))

  return { data, error: null }
}

export function suFetchTotalWorkoutCount(): { data: number; error: string | null } {
  const count = readWorkouts().filter((w) => w.completed_at !== null).length
  return { data: count, error: null }
}

export function suFetchWeeklyWorkoutCount(): { data: number; error: string | null } {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const count = readWorkouts().filter(
    (w) => w.completed_at !== null && new Date(w.completed_at).getTime() >= weekAgo.getTime()
  ).length
  return { data: count, error: null }
}

export function suFetchTotalVolume(): { data: number; error: string | null } {
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

export function suFetchWorkoutById(id: string): { data: WorkoutWithExercises | null; error: string | null } {
  const workout = readWorkouts().find((w) => w.id === id)
  return { data: workout ?? null, error: null }
}

export function suFetchWorkoutForRepeat(workoutId: string): {
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

export function suFetchAllWorkoutsWithSets(): {
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

export function suCreateWorkout(
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
  const userId = getSmartUserId() ?? 'smartuser'

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
    account_id: userId,
    workout_exercises: workoutExercises,
  }

  const existing = readWorkouts()
  existing.push(workout)
  writeWorkouts(existing)

  return { data: { id: workoutId }, error: null }
}

export function suDeleteWorkout(id: string): { error: string | null } {
  const existing = readWorkouts()
  const filtered = existing.filter((w) => w.id !== id)
  writeWorkouts(filtered)
  return { error: null }
}

// Exercise store for SmartUser

const SEED_EXERCISES: Exercise[] = [
  { id: 'seed-1', name: 'Bench Press', muscle_group: 'Chest', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-2', name: 'Incline Dumbbell Press', muscle_group: 'Chest', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-3', name: 'Cable Flyes', muscle_group: 'Chest', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-4', name: 'Push Ups', muscle_group: 'Chest', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-5', name: 'Barbell Squat', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-6', name: 'Leg Press', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-7', name: 'Romanian Deadlift', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-8', name: 'Leg Extension', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-9', name: 'Leg Curl', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-10', name: 'Calf Raises', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-11', name: 'Deadlift', muscle_group: 'Back', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-12', name: 'Pull Ups', muscle_group: 'Back', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-13', name: 'Barbell Row', muscle_group: 'Back', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-14', name: 'Lat Pulldown', muscle_group: 'Back', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-15', name: 'Seated Cable Row', muscle_group: 'Back', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-16', name: 'Overhead Press', muscle_group: 'Shoulders', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-17', name: 'Lateral Raises', muscle_group: 'Shoulders', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-18', name: 'Front Raises', muscle_group: 'Shoulders', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-19', name: 'Face Pulls', muscle_group: 'Shoulders', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-20', name: 'Barbell Curl', muscle_group: 'Arms', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-21', name: 'Dumbbell Curl', muscle_group: 'Arms', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-22', name: 'Tricep Pushdown', muscle_group: 'Arms', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-23', name: 'Skull Crushers', muscle_group: 'Arms', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-24', name: 'Hammer Curl', muscle_group: 'Arms', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-25', name: 'Plank', muscle_group: 'Core', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-26', name: 'Crunches', muscle_group: 'Core', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-27', name: 'Hanging Leg Raises', muscle_group: 'Core', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-28', name: 'Russian Twists', muscle_group: 'Core', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
]

function readCustomExercises(): Exercise[] {
  const raw = localStorage.getItem(exercisesKey())
  if (!raw) return []
  try {
    return JSON.parse(raw) as Exercise[]
  } catch {
    return []
  }
}

function writeCustomExercises(exercises: Exercise[]): void {
  localStorage.setItem(exercisesKey(), JSON.stringify(exercises))
}

function readArchivedIds(): Set<string> {
  const raw = localStorage.getItem(archivedKey())
  if (!raw) return new Set()
  try {
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function writeArchivedIds(ids: Set<string>): void {
  localStorage.setItem(archivedKey(), JSON.stringify([...ids]))
}

export function suFetchAllExercises(): { data: Exercise[] | null; error: string | null } {
  const archived = readArchivedIds()
  const all = [...SEED_EXERCISES, ...readCustomExercises()]
    .filter((e) => !archived.has(e.id))
    .sort((a, b) => a.muscle_group.localeCompare(b.muscle_group) || a.name.localeCompare(b.name))
  return { data: all, error: null }
}

export function suFetchRecentExercises(): { data: Exercise[] | null; error: string | null } {
  const archived = readArchivedIds()
  const all = [...SEED_EXERCISES, ...readCustomExercises()].filter((e) => !archived.has(e.id))
  return { data: all.slice(0, 6), error: null }
}

export function suCreateExercise(name: string, muscleGroup: string): { data: Exercise | null; error: string | null } {
  const exercise: Exercise = {
    id: crypto.randomUUID(),
    name: name.trim(),
    muscle_group: muscleGroup,
    is_custom: true,
    archived_at: null,
    created_at: new Date().toISOString(),
  }

  const existing = readCustomExercises()
  existing.push(exercise)
  writeCustomExercises(existing)
  return { data: exercise, error: null }
}

export function suArchiveExercise(id: string): { error: string | null } {
  const archived = readArchivedIds()
  archived.add(id)
  writeArchivedIds(archived)
  return { error: null }
}

export function suFetchAnalyticsData(): {
  data: { rows: { id: string; exercise_id: string | null; exercise_name_snapshot: string; muscle_group_snapshot: string; workout_id: string; workout_sets: { weight_kg: number; reps: number }[]; workouts: { completed_at: string } }[]; workouts: { completed_at: string | null }[] } | null
  error: string | null
} {
  const workouts = readWorkouts().filter((w) => w.completed_at !== null)

  const rows = workouts.flatMap((w) =>
    w.workout_exercises.map((we) => ({
      id: we.id,
      exercise_id: we.exercise_id,
      exercise_name_snapshot: we.exercise_name_snapshot,
      muscle_group_snapshot: we.muscle_group_snapshot,
      workout_id: w.id,
      workout_sets: we.workout_sets.map((s) => ({ weight_kg: s.weight_kg, reps: s.reps })),
      workouts: { completed_at: w.completed_at! },
    }))
  )

  const workoutDates = workouts.map((w) => ({ completed_at: w.completed_at }))
  return { data: { rows, workouts: workoutDates }, error: null }
}
