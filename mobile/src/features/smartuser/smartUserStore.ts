import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { SEED_EXERCISES } from '../../shared/seedExercises';
import type { Workout, WorkoutWithExercises, DraftExercise, Exercise } from '../../shared/types';

interface StoredWorkout extends WorkoutWithExercises {
  account_id: string;
}

function workoutsKey(userId: string) { return `gymtrack.smartuser.${userId}.workouts`; }
function exercisesKey(userId: string) { return `gymtrack.smartuser.${userId}.exercises`; }
function archivedKey(userId: string) { return `gymtrack.smartuser.${userId}.archivedExercises`; }

async function readWorkouts(userId: string): Promise<StoredWorkout[]> {
  const raw = await AsyncStorage.getItem(workoutsKey(userId));
  if (!raw) return [];
  try { return JSON.parse(raw) as StoredWorkout[]; } catch { return []; }
}

async function writeWorkouts(userId: string, workouts: StoredWorkout[]): Promise<void> {
  await AsyncStorage.setItem(workoutsKey(userId), JSON.stringify(workouts));
}

export async function smartUserFetchRecentWorkouts(userId: string, limit = 3): Promise<{ data: Workout[] | null; error: string | null }> {
  const all = (await readWorkouts(userId))
    .filter((w) => w.completed_at !== null)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, limit);
  return { data: all.map(({ id, name, started_at, completed_at, created_at }) => ({ id, name, started_at, completed_at, created_at })), error: null };
}

export async function smartUserFetchTotalWorkoutCount(userId: string): Promise<{ data: number; error: string | null }> {
  return { data: (await readWorkouts(userId)).filter((w) => w.completed_at !== null).length, error: null };
}

export async function smartUserFetchWeeklyWorkoutCount(userId: string): Promise<{ data: number; error: string | null }> {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const count = (await readWorkouts(userId)).filter(
    (w) => w.completed_at !== null && new Date(w.completed_at).getTime() >= weekAgo.getTime()
  ).length;
  return { data: count, error: null };
}

export async function smartUserFetchTotalVolume(userId: string): Promise<{ data: number; error: string | null }> {
  let volume = 0;
  for (const w of (await readWorkouts(userId)).filter((w) => w.completed_at !== null)) {
    for (const we of w.workout_exercises) {
      for (const s of we.workout_sets) volume += s.reps * s.weight_kg;
    }
  }
  return { data: volume, error: null };
}

export async function smartUserFetchWorkoutById(userId: string, id: string): Promise<{ data: WorkoutWithExercises | null; error: string | null }> {
  return { data: (await readWorkouts(userId)).find((w) => w.id === id) ?? null, error: null };
}

export async function smartUserFetchAllWorkoutsWithSets(userId: string): Promise<{
  data: { id: string; completed_at: string; exerciseCount: number; setCount: number; volume: number; name: string }[] | null;
  error: string | null;
}> {
  const workouts = (await readWorkouts(userId))
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

export async function smartUserCreateWorkout(userId: string, name: string, startedAt: string, entries: DraftExercise[]): Promise<{ data: { id: string } | null; error: string | null }> {
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
    account_id: userId, workout_exercises: workoutExercises,
  };

  const existing = await readWorkouts(userId);
  existing.push(workout);
  await writeWorkouts(userId, existing);
  return { data: { id: workoutId }, error: null };
}

export async function smartUserDeleteWorkout(userId: string, id: string): Promise<{ error: string | null }> {
  await writeWorkouts(userId, (await readWorkouts(userId)).filter((w) => w.id !== id));
  return { error: null };
}

// -- Exercises --

async function readCustomExercises(userId: string): Promise<Exercise[]> {
  const raw = await AsyncStorage.getItem(exercisesKey(userId));
  if (!raw) return [];
  try { return JSON.parse(raw) as Exercise[]; } catch { return []; }
}

async function readArchivedIds(userId: string): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(archivedKey(userId));
  if (!raw) return new Set();
  try { return new Set(JSON.parse(raw) as string[]); } catch { return new Set(); }
}

export async function smartUserFetchAllExercises(userId: string): Promise<{ data: Exercise[] | null; error: string | null }> {
  const archived = await readArchivedIds(userId);
  const custom = await readCustomExercises(userId);
  const all = [...SEED_EXERCISES, ...custom]
    .filter((e) => !archived.has(e.id))
    .sort((a, b) => a.muscle_group.localeCompare(b.muscle_group) || a.name.localeCompare(b.name));
  return { data: all, error: null };
}

export async function smartUserCreateExercise(userId: string, name: string, muscleGroup: string): Promise<{ data: Exercise | null; error: string | null }> {
  const exercise: Exercise = {
    id: Crypto.randomUUID(), name: name.trim(), muscle_group: muscleGroup,
    is_custom: true, archived_at: null, created_at: new Date().toISOString(),
  };
  const existing = await readCustomExercises(userId);
  existing.push(exercise);
  await AsyncStorage.setItem(exercisesKey(userId), JSON.stringify(existing));
  return { data: exercise, error: null };
}

export async function smartUserArchiveExercise(userId: string, id: string): Promise<{ error: string | null }> {
  const archived = await readArchivedIds(userId);
  archived.add(id);
  await AsyncStorage.setItem(archivedKey(userId), JSON.stringify([...archived]));
  return { error: null };
}
