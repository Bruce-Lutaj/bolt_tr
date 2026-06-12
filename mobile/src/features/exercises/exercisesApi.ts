import { supabase } from '../../lib/supabase';
import { isGuestMode, guestFetchAllExercises, guestCreateExercise, guestArchiveExercise } from '../guest/guestStore';
import type { Exercise } from '../../shared/types';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function fetchAllExercises(): Promise<{ data: Exercise[] | null; error: string | null }> {
  if (await isGuestMode()) return guestFetchAllExercises();
  const accountId = await getCurrentUserId();
  if (!accountId) return { data: null, error: 'Not authenticated' };
  const { data, error } = await supabase.from('exercises').select('*')
    .is('archived_at', null).or(`account_id.is.null,account_id.eq.${accountId}`)
    .order('muscle_group').order('name');
  return { data, error: error?.message ?? null };
}

export async function createExercise(name: string, muscleGroup: string): Promise<{ data: Exercise | null; error: string | null }> {
  if (await isGuestMode()) return guestCreateExercise(name, muscleGroup);
  const accountId = await getCurrentUserId();
  if (!accountId) return { data: null, error: 'Not authenticated' };
  const { data, error } = await supabase.from('exercises')
    .insert({ name: name.trim(), muscle_group: muscleGroup, is_custom: true, account_id: accountId }).select().single();
  return { data, error: error?.message ?? null };
}

export async function archiveExercise(id: string): Promise<{ error: string | null }> {
  if (await isGuestMode()) return guestArchiveExercise(id);
  const accountId = await getCurrentUserId();
  if (!accountId) return { error: 'Not authenticated' };
  const { error } = await supabase.from('exercises').update({ archived_at: new Date().toISOString() }).eq('id', id).eq('account_id', accountId);
  return { error: error?.message ?? null };
}
