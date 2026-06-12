import { supabase } from '../../lib/supabase';
import {
  isGuestMode, guestFetchRecentWorkouts, guestFetchTotalWorkoutCount,
  guestFetchWeeklyWorkoutCount, guestFetchTotalVolume, guestFetchWorkoutById,
  guestFetchAllWorkoutsWithSets, guestCreateWorkout, guestDeleteWorkout,
} from '../guest/guestStore';
import type { Workout, WorkoutWithExercises, DraftExercise } from '../../shared/types';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function fetchRecentWorkouts(limit = 3): Promise<{ data: Workout[] | null; error: string | null }> {
  if (await isGuestMode()) return guestFetchRecentWorkouts(limit);
  const accountId = await getCurrentUserId();
  if (!accountId) return { data: null, error: 'Not authenticated' };
  const { data, error } = await supabase.from('workouts').select('*')
    .eq('account_id', accountId).not('completed_at', 'is', null)
    .order('completed_at', { ascending: false }).limit(limit);
  return { data: data as Workout[] | null, error: error?.message ?? null };
}

export async function fetchTotalWorkoutCount(): Promise<{ data: number; error: string | null }> {
  if (await isGuestMode()) return guestFetchTotalWorkoutCount();
  const accountId = await getCurrentUserId();
  if (!accountId) return { data: 0, error: 'Not authenticated' };
  const { count, error } = await supabase.from('workouts').select('id', { count: 'exact', head: true })
    .eq('account_id', accountId).not('completed_at', 'is', null);
  return { data: count ?? 0, error: error?.message ?? null };
}

export async function fetchWeeklyWorkoutCount(): Promise<{ data: number; error: string | null }> {
  if (await isGuestMode()) return guestFetchWeeklyWorkoutCount();
  const accountId = await getCurrentUserId();
  if (!accountId) return { data: 0, error: 'Not authenticated' };
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const { count, error } = await supabase.from('workouts').select('id', { count: 'exact', head: true })
    .eq('account_id', accountId).not('completed_at', 'is', null).gte('completed_at', weekAgo.toISOString());
  return { data: count ?? 0, error: error?.message ?? null };
}

export async function fetchTotalVolume(): Promise<{ data: number; error: string | null }> {
  if (await isGuestMode()) return guestFetchTotalVolume();
  const accountId = await getCurrentUserId();
  if (!accountId) return { data: 0, error: 'Not authenticated' };
  const { data, error } = await supabase.from('workout_sets').select('reps, weight_kg');
  if (error) return { data: 0, error: error.message };
  const volume = (data as { reps: number; weight_kg: number }[] ?? []).reduce((sum, s) => sum + s.reps * s.weight_kg, 0);
  return { data: volume, error: null };
}

export async function fetchWorkoutById(id: string): Promise<{ data: WorkoutWithExercises | null; error: string | null }> {
  if (await isGuestMode()) return guestFetchWorkoutById(id);
  const accountId = await getCurrentUserId();
  if (!accountId) return { data: null, error: 'Not authenticated' };
  const { data, error } = await supabase.from('workouts')
    .select('*, workout_exercises(*, workout_sets(*))')
    .eq('id', id).eq('account_id', accountId).maybeSingle();
  return { data: data as WorkoutWithExercises | null, error: error?.message ?? null };
}

export async function fetchAllWorkoutsWithSets(): Promise<{
  data: { id: string; completed_at: string; exerciseCount: number; setCount: number; volume: number; name: string }[] | null;
  error: string | null;
}> {
  if (await isGuestMode()) return guestFetchAllWorkoutsWithSets();
  const accountId = await getCurrentUserId();
  if (!accountId) return { data: null, error: 'Not authenticated' };
  const { data, error } = await supabase.from('workouts')
    .select('*, workout_exercises(id, workout_sets(reps, weight_kg))')
    .eq('account_id', accountId).not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });
  if (error) return { data: null, error: error.message };

  interface Row { id: string; name: string; completed_at: string | null; workout_exercises: { id: string; workout_sets: { reps: number; weight_kg: number }[] }[] }
  const rows = data as unknown as Row[];
  const mapped = (rows ?? []).map((w) => ({
    id: w.id, completed_at: w.completed_at!, name: w.name,
    exerciseCount: w.workout_exercises?.length ?? 0,
    setCount: w.workout_exercises ? w.workout_exercises.reduce((sum, we) => sum + we.workout_sets.length, 0) : 0,
    volume: w.workout_exercises ? w.workout_exercises.reduce((sum, we) => sum + we.workout_sets.reduce((s, set) => s + set.reps * set.weight_kg, 0), 0) : 0,
  }));
  return { data: mapped, error: null };
}

export async function createWorkout(name: string, startedAt: string, entries: DraftExercise[]): Promise<{ data: { id: string } | null; error: string | null }> {
  if (await isGuestMode()) return guestCreateWorkout(name, startedAt, entries);
  const validEntries = entries.filter((e) => e.sets.some((s) => s.reps !== '' && s.weight !== ''));
  if (validEntries.length === 0) return { data: null, error: 'No valid sets to save' };

  const accountId = await getCurrentUserId();
  if (!accountId) return { data: null, error: 'Not authenticated' };

  const now = new Date().toISOString();
  const { data: workout, error: workoutErr } = await supabase.from('workouts')
    .insert({ name, started_at: startedAt, completed_at: now, account_id: accountId }).select().single();
  if (workoutErr || !workout) return { data: null, error: workoutErr?.message ?? 'Failed to create workout' };

  const workoutId = (workout as { id: string }).id;
  const workoutExercises = validEntries.map((entry, idx) => ({
    workout_id: workoutId, exercise_id: entry.exercise.id ?? null,
    exercise_name_snapshot: entry.exercise.name, muscle_group_snapshot: entry.exercise.muscle_group, position: idx + 1,
  }));

  const { data: insertedExercises, error: exErr } = await supabase.from('workout_exercises').insert(workoutExercises).select();
  if (exErr || !insertedExercises) {
    await supabase.from('workouts').delete().eq('id', workoutId);
    return { data: null, error: exErr?.message ?? 'Failed to save exercises' };
  }

  const sets = validEntries.flatMap((entry, entryIdx) => {
    const we = insertedExercises[entryIdx] as { id: string };
    return entry.sets.filter((s) => s.reps !== '' && s.weight !== '').map((s, idx) => ({
      workout_exercise_id: we.id, set_number: idx + 1,
      reps: parseInt(s.reps) || 1, weight_kg: parseFloat(s.weight) || 0,
    }));
  });

  if (sets.length > 0) {
    const { error: setsErr } = await supabase.from('workout_sets').insert(sets);
    if (setsErr) {
      await supabase.from('workouts').delete().eq('id', workoutId);
      return { data: null, error: setsErr.message };
    }
  }
  return { data: { id: workoutId }, error: null };
}

export async function deleteWorkout(id: string): Promise<{ error: string | null }> {
  if (await isGuestMode()) return guestDeleteWorkout(id);
  const accountId = await getCurrentUserId();
  if (!accountId) return { error: 'Not authenticated' };
  const { error } = await supabase.from('workouts').delete().eq('id', id).eq('account_id', accountId);
  return { error: error?.message ?? null };
}
