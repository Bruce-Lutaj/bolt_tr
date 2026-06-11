import { useState, useEffect, useMemo } from 'react'
import { fetchAnalyticsData } from '../api/analyticsApi'
import {
  buildWeeklyData,
  buildExerciseOptions,
  computeExerciseProgress,
  computePersonalBests,
  computeKpis,
  getMostUsedExercise,
} from '../utils/analyticsCalculations'
import type { WorkoutExerciseRow, WeekData, ExerciseProgressPoint, PersonalBest, AnalyticsKpis, ExerciseOption } from '../types'

export function useAnalytics() {
  const [rows, setRows] = useState<WorkoutExerciseRow[]>([])
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([])
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const result = await fetchAnalyticsData()
    if (result.error || !result.data) {
      setError(result.error ?? 'Failed to load analytics')
      setLoading(false)
      return
    }

    const { rows: fetchedRows, workouts } = result.data
    setRows(fetchedRows)
    setTotalWorkouts(workouts.length)
    setWeeklyData(buildWeeklyData(workouts, fetchedRows))
    setSelectedExercise(getMostUsedExercise(fetchedRows))
    setLoading(false)
  }

  const exerciseOptions: ExerciseOption[] = useMemo(() => buildExerciseOptions(rows), [rows])

  const exerciseProgress: ExerciseProgressPoint[] = useMemo(
    () => (selectedExercise ? computeExerciseProgress(rows, selectedExercise) : []),
    [selectedExercise, rows]
  )

  const personalBests: PersonalBest[] = useMemo(() => computePersonalBests(rows), [rows])

  const kpis: AnalyticsKpis = useMemo(
    () => computeKpis(rows, personalBests, weeklyData),
    [rows, personalBests, weeklyData]
  )

  return {
    weeklyData,
    exerciseOptions,
    exerciseProgress,
    personalBests,
    kpis,
    selectedExercise,
    setSelectedExercise,
    loading,
    error,
    totalWorkouts,
    hasData: rows.length > 0,
  }
}
