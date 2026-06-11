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

    const errors: string[] = []
    if (workoutsRes.error) errors.push(workoutsRes.error)
    if (weekRes.error) errors.push(weekRes.error)
    if (totalRes.error) errors.push(totalRes.error)
    if (volumeRes.error) errors.push(volumeRes.error)

    if (errors.length > 0) setError(errors.join('. '))
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
