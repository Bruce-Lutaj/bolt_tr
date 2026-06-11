import { formatShortDate } from '../../../shared/formatters'
import type { WorkoutExerciseRow, WeekData, ExerciseProgressPoint, PersonalBest, AnalyticsKpis, ExerciseOption } from '../types'

export function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().slice(0, 10)
}

export function buildWeeklyData(
  workouts: { completed_at: string | null }[],
  exerciseRows: WorkoutExerciseRow[]
): WeekData[] {
  const weekMap = new Map<string, { count: number; volume: number }>()

  for (const w of workouts) {
    if (!w.completed_at) continue
    const weekKey = getWeekKey(new Date(w.completed_at))
    const existing = weekMap.get(weekKey) || { count: 0, volume: 0 }
    existing.count++
    weekMap.set(weekKey, existing)
  }

  for (const r of exerciseRows) {
    const completedAt = r.workouts?.completed_at
    if (!completedAt) continue
    const weekKey = getWeekKey(new Date(completedAt))
    const existing = weekMap.get(weekKey) || { count: 0, volume: 0 }
    for (const s of r.workout_sets) {
      existing.volume += s.weight_kg * s.reps
    }
    weekMap.set(weekKey, existing)
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, data]) => ({
      week,
      label: formatShortDate(week),
      ...data,
    }))
}

export function buildExerciseOptions(rows: WorkoutExerciseRow[]): ExerciseOption[] {
  const map = new Map<string, ExerciseOption>()
  for (const r of rows) {
    const key = r.exercise_id || r.exercise_name_snapshot
    if (!map.has(key)) {
      map.set(key, { key, name: r.exercise_name_snapshot, group: r.muscle_group_snapshot })
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export function computeExerciseProgress(rows: WorkoutExerciseRow[], selectedExercise: string): ExerciseProgressPoint[] {
  const relevant = rows.filter(
    (r) => (r.exercise_id || r.exercise_name_snapshot) === selectedExercise
  )

  const bySession = new Map<string, ExerciseProgressPoint>()
  for (const r of relevant) {
    const dateKey = r.workouts.completed_at.slice(0, 10)
    for (const s of r.workout_sets) {
      const existing = bySession.get(dateKey)
      if (!existing || s.weight_kg > existing.maxWeight) {
        bySession.set(dateKey, { maxWeight: s.weight_kg, date: dateKey })
      }
    }
  }

  return Array.from(bySession.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export function computePersonalBests(rows: WorkoutExerciseRow[]): PersonalBest[] {
  const maxByExercise = new Map<string, { name: string; group: string; weight: number }>()
  for (const r of rows) {
    const key = r.exercise_id || r.exercise_name_snapshot
    for (const s of r.workout_sets) {
      const existing = maxByExercise.get(key)
      if (!existing || s.weight_kg > existing.weight) {
        maxByExercise.set(key, { name: r.exercise_name_snapshot, group: r.muscle_group_snapshot, weight: s.weight_kg })
      }
    }
  }
  return Array.from(maxByExercise.entries())
    .map(([key, data]) => ({ key, ...data }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8)
}

export function computeKpis(
  rows: WorkoutExerciseRow[],
  personalBests: PersonalBest[],
  weeklyData: WeekData[]
): AnalyticsKpis {
  const heaviestLift = personalBests.length > 0 ? personalBests[0].weight : 0

  const muscleGroupCounts = new Map<string, number>()
  for (const r of rows) {
    muscleGroupCounts.set(r.muscle_group_snapshot, (muscleGroupCounts.get(r.muscle_group_snapshot) || 0) + 1)
  }
  let topMuscle = '-'
  let topCount = 0
  for (const [group, count] of muscleGroupCounts) {
    if (count > topCount) {
      topMuscle = group
      topCount = count
    }
  }

  let streak = 0
  if (weeklyData.length > 0) {
    for (let i = weeklyData.length - 1; i >= 0; i--) {
      if (weeklyData[i].count > 0) streak++
      else break
    }
  }

  return { heaviestLift, topMuscle, streak }
}

export function getMostUsedExercise(rows: WorkoutExerciseRow[]): string | null {
  if (rows.length === 0) return null
  const exerciseCounts = new Map<string, number>()
  for (const r of rows) {
    const key = r.exercise_id || r.exercise_name_snapshot
    exerciseCounts.set(key, (exerciseCounts.get(key) || 0) + r.workout_sets.length)
  }
  let mostUsed = rows[0].exercise_id || rows[0].exercise_name_snapshot
  let maxCount = 0
  for (const [id, count] of exerciseCounts) {
    if (count > maxCount) {
      mostUsed = id
      maxCount = count
    }
  }
  return mostUsed
}
