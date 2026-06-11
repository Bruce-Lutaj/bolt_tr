import type { Exercise } from '../types'

const STORAGE_KEY = 'gymtrack.activeWorkoutDraft'

export interface DraftSet {
  id: string
  reps: string
  weight: string
}

export interface DraftExercise {
  id: string
  exercise: Exercise
  sets: DraftSet[]
}

export interface WorkoutDraft {
  version: 1
  name: string
  startedAt: string
  exercises: DraftExercise[]
}

export function saveDraft(draft: WorkoutDraft): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export function loadDraft(): WorkoutDraft | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.version === 1) return parsed
    return null
  } catch {
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasDraft(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function getDraftSummary(): { exerciseCount: number; setCount: number; startedAt: string } | null {
  const draft = loadDraft()
  if (!draft) return null
  const setCount = draft.exercises.reduce((sum, e) => sum + e.sets.filter(s => s.reps && s.weight).length, 0)
  return {
    exerciseCount: draft.exercises.length,
    setCount,
    startedAt: draft.startedAt,
  }
}
