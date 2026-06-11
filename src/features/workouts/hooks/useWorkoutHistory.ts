import { useState, useEffect } from 'react'
import { fetchAllWorkoutsWithSets } from '../api/workoutsApi'

export interface HistoryWorkout {
  id: string
  name: string
  completed_at: string
  exerciseCount: number
  setCount: number
  volume: number
}

export function useWorkoutHistory() {
  const [workouts, setWorkouts] = useState<HistoryWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const result = await fetchAllWorkoutsWithSets()
    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setWorkouts(result.data)
    }
    setLoading(false)
  }

  return { workouts, loading, error }
}
