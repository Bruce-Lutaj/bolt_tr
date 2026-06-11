const DRAFT_KEY_PREFIX = 'gymtrack.activeWorkoutDraft'

export function getDraftStorageKey(userId: string): string {
  return `${DRAFT_KEY_PREFIX}.${userId}`
}

export const ACTIVE_WORKOUT_DRAFT_KEY = DRAFT_KEY_PREFIX
