import { supabase } from '../../lib/supabase';
import { getActiveAccountIdentity } from '../../lib/identity';
import { guestFetchAllExercises, guestCreateExercise, guestArchiveExercise } from '../guest/guestStore';
import { smartUserFetchAllExercises, smartUserCreateExercise, smartUserArchiveExercise } from '../smartuser/smartUserStore';
import type { Exercise } from '../../shared/types';

export async function fetchAllExercises(): Promise<{ data: Exercise[] | null; error: string | null }> {
  const { provider, accountId } = await getActiveAccountIdentity();
  if (provider === 'guest') return guestFetchAllExercises();
  if (provider === 'smartuser') {
    if (!accountId) return { data: null, error: 'Not authenticated' };
    return smartUserFetchAllExercises(accountId);
  }
  if (!accountId) return { data: null, error: 'Not authenticated' };
  const { data, error } = await supabase.from('exercises').select('*')
    .is('archived_at', null).or(`account_id.is.null,account_id.eq.${accountId}`)
    .order('muscle_group').order('name');
  return { data, error: error?.message ?? null };
}

export async function createExercise(name: string, muscleGroup: string): Promise<{ data: Exercise | null; error: string | null }> {
  const { provider, accountId } = await getActiveAccountIdentity();
  if (provider === 'guest') return guestCreateExercise(name, muscleGroup);
  if (provider === 'smartuser') {
    if (!accountId) return { data: null, error: 'Not authenticated' };
    return smartUserCreateExercise(accountId, name, muscleGroup);
  }
  if (!accountId) return { data: null, error: 'Not authenticated' };
  const { data, error } = await supabase.from('exercises')
    .insert({ name: name.trim(), muscle_group: muscleGroup, is_custom: true, account_id: accountId }).select().single();
  return { data, error: error?.message ?? null };
}

export async function archiveExercise(id: string): Promise<{ error: string | null }> {
  const { provider, accountId } = await getActiveAccountIdentity();
  if (provider === 'guest') return guestArchiveExercise(id);
  if (provider === 'smartuser') {
    if (!accountId) return { error: 'Not authenticated' };
    return smartUserArchiveExercise(accountId, id);
  }
  if (!accountId) return { error: 'Not authenticated' };
  const { error } = await supabase.from('exercises').update({ archived_at: new Date().toISOString() }).eq('id', id).eq('account_id', accountId);
  return { error: error?.message ?? null };
}
