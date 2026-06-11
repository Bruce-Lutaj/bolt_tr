export interface WorkoutExerciseRow {
  id: string
  exercise_id: string | null
  exercise_name_snapshot: string
  muscle_group_snapshot: string
  workout_id: string
  workout_sets: { weight_kg: number; reps: number }[]
  workouts: { completed_at: string }
}

export interface WeekData {
  week: string
  label: string
  count: number
  volume: number
}

export interface ExerciseProgressPoint {
  date: string
  maxWeight: number
}

export interface PersonalBest {
  key: string
  name: string
  group: string
  weight: number
}

export interface AnalyticsKpis {
  heaviestLift: number
  topMuscle: string
  streak: number
}

export interface ExerciseOption {
  key: string
  name: string
  group: string
}
