import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchWorkoutForRepeat } from '../api/workoutsApi'
import { ROUTES } from '../../../shared/routes'
import type { WorkoutDraft } from '../types'

const STORAGE_KEY = 'gymtrack.activeWorkoutDraft'

export function useRepeatWorkout() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const repeat = useCallback(async (workoutId: string) => {
    setLoading(true)
    const result = await fetchWorkoutForRepeat(workoutId)

    if (!result.data || result.data.length === 0) {
      setLoading(false)
      return
    }

    const draft: WorkoutDraft = {
      version: 1,
      name: '',
      startedAt: new Date().toISOString(),
      exercises: result.data.map((we) => ({
        id: crypto.randomUUID(),
        exercise: {
          id: we.exercise_id ?? crypto.randomUUID(),
          name: we.exercise_name_snapshot,
          muscle_group: we.muscle_group_snapshot,
          is_custom: false,
          archived_at: null,
          created_at: '',
        },
        sets: (we.workout_sets as { set_number: number; reps: number; weight_kg: number }[])
          .sort((a, b) => a.set_number - b.set_number)
          .map((s) => ({
            id: crypto.randomUUID(),
            reps: s.reps.toString(),
            weight: s.weight_kg.toString(),
          })),
      })),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    navigate(ROUTES.workout)
    setLoading(false)
  }, [navigate])

  return { repeat, loading }
}
