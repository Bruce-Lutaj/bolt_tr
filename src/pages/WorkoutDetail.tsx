import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '../supabase'
import type { WorkoutWithExercises } from '../types'

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState<WorkoutWithExercises | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('workouts')
      .select('*, workout_exercises(*, workout_sets(*))')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setWorkout(data as WorkoutWithExercises | null)
        setLoading(false)
      })
  }, [id])

  async function deleteWorkout() {
    if (!id || !confirm('Delete this workout?')) return
    setDeleting(true)
    await supabase.from('workouts').delete().eq('id', id)
    navigate('/history')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="px-5 pt-12 text-center text-slate-500">
        <p>Workout not found</p>
      </div>
    )
  }

  const sortedExercises = [...workout.workout_exercises].sort((a, b) => a.position - b.position)
  const totalSets = sortedExercises.reduce((sum, we) => sum + we.workout_sets.length, 0)
  const totalVolume = sortedExercises.reduce(
    (sum, we) => sum + we.workout_sets.reduce((s, set) => s + set.reps * set.weight_kg, 0),
    0
  )

  return (
    <div className="px-5 pt-12 pb-6">
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={deleteWorkout}
          disabled={deleting}
          className="p-2 text-slate-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </header>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">{workout.name}</h1>
        {workout.completed_at && (
          <p className="text-sm text-slate-500 mt-1">
            {new Date(workout.completed_at).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{totalSets}</p>
          <p className="text-[10px] text-slate-500 uppercase">Total Sets</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">
            {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}K` : Math.round(totalVolume)}
          </p>
          <p className="text-[10px] text-slate-500 uppercase">Volume (kg)</p>
        </div>
      </div>

      <div className="space-y-4">
        {sortedExercises.map((we) => (
          <div key={we.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="mb-3">
              <p className="font-semibold text-white text-sm">{we.exercise_name_snapshot}</p>
              <p className="text-[10px] text-slate-500 uppercase">{we.muscle_group_snapshot}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <span className="text-[10px] text-slate-600 text-center">SET</span>
              <span className="text-[10px] text-slate-600 text-center">KG</span>
              <span className="text-[10px] text-slate-600 text-center">REPS</span>
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
