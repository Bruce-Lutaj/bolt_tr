import { useReducer, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { workoutDraftReducer, initialDraftState } from '../state/workoutDraftReducer'
import { createWorkout } from '../api/workoutsApi'
import { countValidDraftSets } from '../utils/workoutCalculations'
import { ROUTES } from '../../../shared/routes'
import type { WorkoutDraft, DraftExercise } from '../types'
import type { Exercise } from '../../exercises/types'

const STORAGE_KEY = 'gymtrack.activeWorkoutDraft'

function loadFromStorage(): { name: string; startedAt: string; exercises: DraftExercise[] } | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as WorkoutDraft
    if (parsed?.version === 1) return { name: parsed.name, startedAt: parsed.startedAt, exercises: parsed.exercises }
    return null
  } catch {
    return null
  }
}

function saveToStorage(name: string, startedAt: string, exercises: DraftExercise[]): void {
  const draft: WorkoutDraft = { version: 1, name, startedAt, exercises }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export function clearDraftStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasDraft(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function getDraftSummary(): { exerciseCount: number; setCount: number; startedAt: string } | null {
  const raw = localStorage.getItem(STORAGE_KEY)
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

export function useActiveWorkoutDraft() {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(workoutDraftReducer, initialDraftState)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    const saved = loadFromStorage()
    if (saved) {
      dispatch({ type: 'INIT', payload: saved })
    } else {
      dispatch({ type: 'INIT', payload: { name: '', startedAt: new Date().toISOString(), exercises: [] } })
    }
    initialized.current = true
  }, [])

  useEffect(() => {
    if (!initialized.current) return
    if (!state.startedAt) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveToStorage(state.name, state.startedAt, state.exercises)
    }, 400)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state])

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
    clearDraftStorage()
    dispatch({ type: 'RESET' })
    navigate(ROUTES.home)
  }, [navigate])

  const finish = useCallback(async (): Promise<string | null> => {
    const validSets = countValidDraftSets(state.exercises)
    if (validSets === 0) return 'No valid sets to save'

    const name = state.name.trim() || `Workout ${new Date().toLocaleDateString()}`
    const result = await createWorkout(name, state.startedAt, state.exercises)

    if (result.error) return result.error

    clearDraftStorage()
    dispatch({ type: 'RESET' })
    navigate(ROUTES.workoutDetail(result.data!.id))
    return null
  }, [state, navigate])

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
