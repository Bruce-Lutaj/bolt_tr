import { useState, useEffect } from 'react'
import { fetchRecentWorkouts, fetchTotalWorkoutCount, fetchWeeklyWorkoutCount, fetchTotalVolume } from '../api/workoutsApi'
import type { Workout } from '../types'

export interface HomeStats {
  thisWeek: number
  totalWorkouts: number
  totalVolume: number
}

export function useHomeStats() {
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [stats, setStats] = useState<HomeStats>({ thisWeek: 0, totalWorkouts: 0, totalVolume: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [workoutsRes, weekRes, totalRes, volumeRes] = await Promise.all([
      fetchRecentWorkouts(3),
      fetchWeeklyWorkoutCount(),
      fetchTotalWorkoutCount(),
      fetchTotalVolume(),
    ])

    if (workoutsRes.error) setError(workoutsRes.error)
    if (workoutsRes.data) setRecentWorkouts(workoutsRes.data)

    setStats({
      thisWeek: weekRes.data,
      totalWorkouts: totalRes.data,
      totalVolume: volumeRes.data,
    })
    setLoading(false)
  }

  return { recentWorkouts, stats, loading, error }
}
