import { useState, useEffect } from 'react'
import { fetchWorkoutById } from '../api/workoutsApi'
import type { WorkoutWithExercises } from '../types'

export function useWorkoutDetail(id: string | undefined) {
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    load(id)
  }, [id])

  async function load(workoutId: string) {
    setLoading(true)
    const result = await fetchWorkoutById(workoutId)
    if (result.error) {
      setError(result.error)
    } else {
      setWorkout(result.data)
    }
    setLoading(false)
  }

  return { workout, loading, error }
}
