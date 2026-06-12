import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { Workout, WorkoutWithExercises, DraftExercise, Exercise } from '../../shared/types';

const WORKOUTS_KEY = 'gymtrack.guest.workouts';
const EXERCISES_KEY = 'gymtrack.guest.exercises';
const ARCHIVED_KEY = 'gymtrack.guest.archivedExercises';
const AUTH_MODE_KEY = 'gymtrack.authMode';

interface StoredWorkout extends WorkoutWithExercises {
  account_id: string;
}

export async function isGuestMode(): Promise<boolean> {
  return (await AsyncStorage.getItem(AUTH_MODE_KEY)) === 'guest';
}

async function readWorkouts(): Promise<StoredWorkout[]> {
  const raw = await AsyncStorage.getItem(WORKOUTS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as StoredWorkout[]; } catch { return []; }
}

async function writeWorkouts(workouts: StoredWorkout[]): Promise<void> {
  await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export async function guestFetchRecentWorkouts(limit = 3): Promise<{ data: Workout[] | null; error: string | null }> {
  const all = (await readWorkouts())
    .filter((w) => w.completed_at !== null)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, limit);
  return { data: all.map(({ id, name, started_at, completed_at, created_at }) => ({ id, name, started_at, completed_at, created_at })), error: null };
}

export async function guestFetchTotalWorkoutCount(): Promise<{ data: number; error: string | null }> {
  return { data: (await readWorkouts()).filter((w) => w.completed_at !== null).length, error: null };
}

export async function guestFetchWeeklyWorkoutCount(): Promise<{ data: number; error: string | null }> {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const count = (await readWorkouts()).filter(
    (w) => w.completed_at !== null && new Date(w.completed_at).getTime() >= weekAgo.getTime()
  ).length;
  return { data: count, error: null };
}

export async function guestFetchTotalVolume(): Promise<{ data: number; error: string | null }> {
  let volume = 0;
  for (const w of (await readWorkouts()).filter((w) => w.completed_at !== null)) {
    for (const we of w.workout_exercises) {
      for (const s of we.workout_sets) volume += s.reps * s.weight_kg;
    }
  }
  return { data: volume, error: null };
}

export async function guestFetchWorkoutById(id: string): Promise<{ data: WorkoutWithExercises | null; error: string | null }> {
  return { data: (await readWorkouts()).find((w) => w.id === id) ?? null, error: null };
}

export async function guestFetchAllWorkoutsWithSets(): Promise<{
  data: { id: string; completed_at: string; exerciseCount: number; setCount: number; volume: number; name: string }[] | null;
  error: string | null;
}> {
  const workouts = (await readWorkouts())
    .filter((w) => w.completed_at !== null)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());
  const mapped = workouts.map((w) => ({
    id: w.id,
    completed_at: w.completed_at!,
    exerciseCount: w.workout_exercises.length,
    setCount: w.workout_exercises.reduce((sum, we) => sum + we.workout_sets.length, 0),
    volume: w.workout_exercises.reduce((sum, we) => sum + we.workout_sets.reduce((s, set) => s + set.reps * set.weight_kg, 0), 0),
    name: w.name,
  }));
  return { data: mapped, error: null };
}

export async function guestCreateWorkout(name: string, startedAt: string, entries: DraftExercise[]): Promise<{ data: { id: string } | null; error: string | null }> {
  const validEntries = entries.filter((e) => e.sets.some((s) => s.reps !== '' && s.weight !== ''));
  if (validEntries.length === 0) return { data: null, error: 'No valid sets to save' };

  const now = new Date().toISOString();
  const workoutId = Crypto.randomUUID();

  const workoutExercises = validEntries.map((entry, idx) => {
    const weId = Crypto.randomUUID();
    return {
      id: weId,
      workout_id: workoutId,
      exercise_id: entry.exercise.id,
      exercise_name_snapshot: entry.exercise.name,
      muscle_group_snapshot: entry.exercise.muscle_group,
      position: idx + 1,
      created_at: now,
      workout_sets: entry.sets
        .filter((s) => s.reps !== '' && s.weight !== '')
        .map((s, sIdx) => ({
          id: Crypto.randomUUID(),
          workout_exercise_id: weId,
          set_number: sIdx + 1,
          reps: parseInt(s.reps) || 1,
          weight_kg: parseFloat(s.weight) || 0,
          created_at: now,
        })),
    };
  });

  const workout: StoredWorkout = {
    id: workoutId, name, started_at: startedAt, completed_at: now, created_at: now,
    account_id: 'guest', workout_exercises: workoutExercises,
  };

  const existing = await readWorkouts();
  existing.push(workout);
  await writeWorkouts(existing);
  return { data: { id: workoutId }, error: null };
}

export async function guestDeleteWorkout(id: string): Promise<{ error: string | null }> {
  await writeWorkouts((await readWorkouts()).filter((w) => w.id !== id));
  return { error: null };
}

// -- Exercises --

const SEED_EXERCISES: Exercise[] = [
  { id: 'seed-1', name: 'Bench Press', muscle_group: 'Chest', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-2', name: 'Incline Dumbbell Press', muscle_group: 'Chest', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-3', name: 'Cable Flyes', muscle_group: 'Chest', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-4', name: 'Barbell Squat', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-5', name: 'Leg Press', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-6', name: 'Romanian Deadlift', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-7', name: 'Leg Extension', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-8', name: 'Leg Curl', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-9', name: 'Calf Raises', muscle_group: 'Legs', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-10', name: 'Deadlift', muscle_group: 'Back', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-11', name: 'Pull Ups', muscle_group: 'Back', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-12', name: 'Barbell Row', muscle_group: 'Back', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-13', name: 'Lat Pulldown', muscle_group: 'Back', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-14', name: 'Seated Cable Row', muscle_group: 'Back', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-15', name: 'Overhead Press', muscle_group: 'Shoulders', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-16', name: 'Lateral Raises', muscle_group: 'Shoulders', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-17', name: 'Face Pulls', muscle_group: 'Shoulders', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-18', name: 'Barbell Curl', muscle_group: 'Arms', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-19', name: 'Tricep Pushdown', muscle_group: 'Arms', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-20', name: 'Hammer Curl', muscle_group: 'Arms', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-21', name: 'Skull Crushers', muscle_group: 'Arms', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-22', name: 'Plank', muscle_group: 'Core', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-23', name: 'Hanging Leg Raises', muscle_group: 'Core', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: 'seed-24', name: 'Russian Twists', muscle_group: 'Core', is_custom: false, archived_at: null, created_at: '2024-01-01T00:00:00Z' },
];

async function readCustomExercises(): Promise<Exercise[]> {
  const raw = await AsyncStorage.getItem(EXERCISES_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Exercise[]; } catch { return []; }
}

async function readArchivedIds(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(ARCHIVED_KEY);
  if (!raw) return new Set();
  try { return new Set(JSON.parse(raw) as string[]); } catch { return new Set(); }
}

export async function guestFetchAllExercises(): Promise<{ data: Exercise[] | null; error: string | null }> {
  const archived = await readArchivedIds();
  const custom = await readCustomExercises();
  const all = [...SEED_EXERCISES, ...custom]
    .filter((e) => !archived.has(e.id))
    .sort((a, b) => a.muscle_group.localeCompare(b.muscle_group) || a.name.localeCompare(b.name));
  return { data: all, error: null };
}

export async function guestCreateExercise(name: string, muscleGroup: string): Promise<{ data: Exercise | null; error: string | null }> {
  const exercise: Exercise = {
    id: Crypto.randomUUID(), name: name.trim(), muscle_group: muscleGroup,
    is_custom: true, archived_at: null, created_at: new Date().toISOString(),
  };
  const existing = await readCustomExercises();
  existing.push(exercise);
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(existing));
  return { data: exercise, error: null };
}

export async function guestArchiveExercise(id: string): Promise<{ error: string | null }> {
  const archived = await readArchivedIds();
  archived.add(id);
  await AsyncStorage.setItem(ARCHIVED_KEY, JSON.stringify([...archived]));
  return { error: null };
}
