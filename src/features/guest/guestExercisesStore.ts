import type { Exercise } from '../exercises/types'

const CUSTOM_EXERCISES_KEY = 'gymtrack.guest.exercises'
const ARCHIVED_KEY = 'gymtrack.guest.archivedExercises'

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
  const raw = localStorage.getItem(CUSTOM_EXERCISES_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Exercise[]
  } catch {
    return []
  }
}

function writeCustomExercises(exercises: Exercise[]): void {
  localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(exercises))
}

function readArchivedIds(): Set<string> {
  const raw = localStorage.getItem(ARCHIVED_KEY)
  if (!raw) return new Set()
  try {
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function writeArchivedIds(ids: Set<string>): void {
  localStorage.setItem(ARCHIVED_KEY, JSON.stringify([...ids]))
}

export function guestFetchAllExercises(): { data: Exercise[] | null; error: string | null } {
  const archived = readArchivedIds()
  const all = [...SEED_EXERCISES, ...readCustomExercises()]
    .filter((e) => !archived.has(e.id))
    .sort((a, b) => a.muscle_group.localeCompare(b.muscle_group) || a.name.localeCompare(b.name))

  return { data: all, error: null }
}

export function guestFetchRecentExercises(): { data: Exercise[] | null; error: string | null } {
  const archived = readArchivedIds()
  const all = [...SEED_EXERCISES, ...readCustomExercises()].filter((e) => !archived.has(e.id))
  return { data: all.slice(0, 6), error: null }
}

export function guestCreateExercise(name: string, muscleGroup: string): { data: Exercise | null; error: string | null } {
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

export function guestArchiveExercise(id: string): { error: string | null } {
  const archived = readArchivedIds()
  archived.add(id)
  writeArchivedIds(archived)
  return { error: null }
}
