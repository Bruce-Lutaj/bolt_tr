export interface Exercise {
  id: string
  name: string
  muscle_group: string
  created_at: string
}

export interface Workout {
  id: string
  name: string
  completed_at: string | null
  created_at: string
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_id: string
  set_number: number
  reps: number
  weight: number
  created_at: string
}

export interface WorkoutSetWithExercise extends WorkoutSet {
  exercises: Exercise
}

export interface WorkoutWithSets extends Workout {
  workout_sets: WorkoutSetWithExercise[]
}
