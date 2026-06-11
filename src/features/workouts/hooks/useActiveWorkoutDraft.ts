import { useReducer, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { workoutDraftReducer, initialDraftState } from '../state/workoutDraftReducer'
import { createWorkout } from '../api/workoutsApi'
import { countValidDraftSets } from '../utils/workoutCalculations'
import { ROUTES } from '../../../shared/routes'
import { getDraftStorageKey } from '../constants'
import type { WorkoutDraft, DraftExercise } from '../types'
import type { Exercise } from '../../exercises/types'

function loadFromStorage(key: string): { name: string; startedAt: string; exercises: DraftExercise[] } | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as WorkoutDraft
    if (parsed?.version === 1) return { name: parsed.name, startedAt: parsed.startedAt, exercises: parsed.exercises }
    return null
  } catch {
    return null
  }
}

function saveToStorage(key: string, name: string, startedAt: string, exercises: DraftExercise[]): void {
  const draft: WorkoutDraft = { version: 1, name, startedAt, exercises }
  localStorage.setItem(key, JSON.stringify(draft))
}

export function clearDraftStorage(userId: string): void {
  localStorage.removeItem(getDraftStorageKey(userId))
}

export function hasDraft(userId: string | null): boolean {
  if (!userId) return false
  return localStorage.getItem(getDraftStorageKey(userId)) !== null
}

export function getDraftSummary(userId: string | null): { exerciseCount: number; setCount: number; startedAt: string } | null {
  if (!userId) return null
  const raw = localStorage.getItem(getDraftStorageKey(userId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as WorkoutDraft
    if (parsed?.version !== 1) return null
    const setCount = parsed.exercises.reduce((sum, e) => sum + e.sets.filter(s => s.reps && s.weight).length, 0)
    return { exerciseCount: parsed.exercises.length, setCount, startedAt: parsed.startedAt }
  } catch {
    return null
  }
}

export function useActiveWorkoutDraft(userId: string) {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(workoutDraftReducer, initialDraftState)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)
  const storageKey = getDraftStorageKey(userId)

  useEffect(() => {
    const saved = loadFromStorage(storageKey)
    if (saved) {
      dispatch({ type: 'INIT', payload: saved })
    } else {
      dispatch({ type: 'INIT', payload: { name: '', startedAt: new Date().toISOString(), exercises: [] } })
    }
    initialized.current = true
  }, [storageKey])

  useEffect(() => {
    if (!initialized.current) return
    if (!state.startedAt) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveToStorage(storageKey, state.name, state.startedAt, state.exercises)
    }, 400)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state, storageKey])

  const setName = useCallback((name: string) => {
    dispatch({ type: 'SET_NAME', payload: name })
  }, [])

  const addExercise = useCallback((exercise: Exercise) => {
    dispatch({ type: 'ADD_EXERCISE', payload: exercise })
  }, [])

  const removeExercise = useCallback((entryId: string) => {
    dispatch({ type: 'REMOVE_EXERCISE', payload: entryId })
  }, [])

  const addSet = useCallback((entryId: string) => {
    dispatch({ type: 'ADD_SET', payload: entryId })
  }, [])

  const removeSet = useCallback((entryId: string, setId: string) => {
    dispatch({ type: 'REMOVE_SET', payload: { entryId, setId } })
  }, [])

  const updateSet = useCallback((entryId: string, setId: string, field: 'reps' | 'weight', value: string) => {
    dispatch({ type: 'UPDATE_SET', payload: { entryId, setId, field, value } })
  }, [])

  const copyPreviousSet = useCallback((entryId: string, setIndex: number) => {
    dispatch({ type: 'COPY_PREVIOUS_SET', payload: { entryId, setIndex } })
  }, [])

  const discard = useCallback(() => {
    clearDraftStorage(userId)
    dispatch({ type: 'RESET' })
    navigate(ROUTES.home)
  }, [navigate, userId])

  const finish = useCallback(async (): Promise<string | null> => {
    const validSets = countValidDraftSets(state.exercises)
    if (validSets === 0) return 'No valid sets to save'

    const name = state.name.trim() || `Workout ${new Date().toLocaleDateString()}`
    const result = await createWorkout(name, state.startedAt, state.exercises)

    if (result.error) return result.error

    clearDraftStorage(userId)
    dispatch({ type: 'RESET' })
    navigate(ROUTES.workoutDetail(result.data!.id))
    return null
  }, [state, navigate, userId])

  const validSetCount = countValidDraftSets(state.exercises)

  return {
    state,
    validSetCount,
    setName,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    copyPreviousSet,
    discard,
    finish,
  }
}
