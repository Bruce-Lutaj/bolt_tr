import { supabase } from '../../../lib/supabase/client'
import { getCurrentUserId } from '../../auth/api/authApi'
import { isGuestMode } from '../../guest/guestStore'
import { guestFetchAllExercises, guestFetchRecentExercises, guestCreateExercise, guestArchiveExercise } from '../../guest/guestExercisesStore'
import { isSmartUserMode, suFetchAllExercises, suFetchRecentExercises, suCreateExercise, suArchiveExercise } from '../../smartuser/smartUserStore'
import type { Exercise } from '../types'

export async function fetchAllExercises(): Promise<{ data: Exercise[] | null; error: string | null }> {
  if (isGuestMode()) return guestFetchAllExercises()
  if (isSmartUserMode()) return suFetchAllExercises()

  const accountId = await getCurrentUserId()
  if (!accountId) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .is('archived_at', null)
    .or(`account_id.is.null,account_id.eq.${accountId}`)
    .order('muscle_group')
    .order('name')

  return { data, error: error?.message ?? null }
}

export async function fetchRecentExercises(limit = 20): Promise<{ data: Exercise[] | null; error: string | null }> {
  if (isGuestMode()) return guestFetchRecentExercises()
  if (isSmartUserMode()) return suFetchRecentExercises()

  const accountId = await getCurrentUserId()
  if (!accountId) return { data: null, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('workout_exercises')
    .select('exercise_id, exercises!inner(*)')
    .not('exercise_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error: error.message }

  const seen = new Set<string>()
  const recent: Exercise[] = []
  for (const row of (data ?? [])) {
    const ex = row.exercises as unknown as Exercise
    if (ex && !seen.has(ex.id) && !ex.archived_at) {
      seen.add(ex.id)
      recent.push(ex)
      if (recent.length >= 6) break
    }
  }
  return { data: recent, error: null }
}

export async function createExercise(name: string, muscleGroup: string): Promise<{ data: Exercise | null; error: string | null }> {
  if (isGuestMode()) return guestCreateExercise(name, muscleGroup)
  if (isSmartUserMode()) return suCreateExercise(name, muscleGroup)

  const accountId = await getCurrentUserId()
  if (!accountId) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('exercises')
    .insert({ name: name.trim(), muscle_group: muscleGroup, is_custom: true, account_id: accountId })
    .select()
    .single()

  return { data, error: error?.message ?? null }
}

export async function archiveExercise(id: string): Promise<{ error: string | null }> {
  if (isGuestMode()) return guestArchiveExercise(id)
  if (isSmartUserMode()) return suArchiveExercise(id)

  const accountId = await getCurrentUserId()
  if (!accountId) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('exercises')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('account_id', accountId)

  return { error: error?.message ?? null }
}
