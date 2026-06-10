export interface Exercise {
  id: string
  name: string
  muscle_group: string
  is_custom: boolean
  archived_at: string | null
  created_at: string
}

export interface Workout {
  id: string
  name: string
  started_at: string
  completed_at: string | null
  created_at: string
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string | null
  exercise_name_snapshot: string
  muscle_group_snapshot: string
  position: number
  created_at: string
}

export interface WorkoutSet {
  id: string
  workout_exercise_id: string
  set_number: number
  reps: number
  weight_kg: number
  created_at: string
}

export interface WorkoutExerciseWithSets extends WorkoutExercise {
  workout_sets: WorkoutSet[]
}

export interface WorkoutWithExercises extends Workout {
  workout_exercises: WorkoutExerciseWithSets[]
}
