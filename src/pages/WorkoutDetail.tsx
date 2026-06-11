import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, RotateCcw } from 'lucide-react'
import { useWorkoutDetail, useRepeatWorkout, calculateTotalVolume, calculateTotalSets, deleteWorkout } from '../features/workouts'
import { ROUTES } from '../shared/routes'
import { formatDateLong, formatVolume } from '../shared/formatters'
import { LoadingSpinner, InlineError } from '../components/ui'

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { workout, loading, error } = useWorkoutDetail(id)
  const { repeat } = useRepeatWorkout()
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    if (!id || !confirm('Delete this workout?')) return
    setDeleting(true)
    const result = await deleteWorkout(id)
    if (result.error) {
      setDeleteError(result.error)
      setDeleting(false)
    } else {
      navigate(ROUTES.history)
    }
  }

  if (loading) {
    return <LoadingSpinner className="flex justify-center items-center h-64" />
  }

  if (error || !workout) {
    return (
      <div className="px-5 pt-12 text-center text-slate-500">
        <p>{error ?? 'Workout not found'}</p>
      </div>
    )
  }

  const sortedExercises = [...workout.workout_exercises].sort((a, b) => a.position - b.position)
  const totalSets = calculateTotalSets(sortedExercises)
  const totalVolume = calculateTotalVolume(sortedExercises)

  return (
    <div className="px-5 pt-10 pb-6">
      <header className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => repeat(workout.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-400 hover:text-green-300 bg-green-600/10 hover:bg-green-600/20 rounded-lg transition-colors"
            title="Repeat this workout"
          >
            <RotateCcw size={14} />
            Repeat
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-slate-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </header>

      <InlineError error={deleteError} className="mb-4" />

      <div className="mb-5">
        <h1 className="text-xl font-bold text-white">{workout.name}</h1>
        {workout.completed_at && (
          <p className="text-sm text-slate-500 mt-0.5">
            {formatDateLong(workout.completed_at)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-white">{sortedExercises.length}</p>
          <p className="text-[9px] text-slate-500 uppercase">Exercises</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-white">{totalSets}</p>
          <p className="text-[9px] text-slate-500 uppercase">Sets</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-white">{formatVolume(totalVolume)}</p>
          <p className="text-[9px] text-slate-500 uppercase">Volume (kg)</p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedExercises.map((we) => (
          <div key={we.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="mb-3">
              <p className="font-semibold text-white text-sm">{we.exercise_name_snapshot}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{we.muscle_group_snapshot}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <span className="text-[10px] text-slate-600 text-center font-medium">SET</span>
              <span className="text-[10px] text-slate-600 text-center font-medium">KG</span>
              <span className="text-[10px] text-slate-600 text-center font-medium">REPS</span>
            </div>

            {[...we.workout_sets]
              .sort((a, b) => a.set_number - b.set_number)
              .map((set) => (
                <div key={set.id} className="grid grid-cols-3 gap-2 py-1.5">
                  <span className="text-xs text-slate-500 text-center">{set.set_number}</span>
                  <span className="text-sm text-white text-center font-medium">{set.weight_kg}</span>
                  <span className="text-sm text-white text-center font-medium">{set.reps}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
