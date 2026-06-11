import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Dumbbell, ChevronRight } from 'lucide-react'
import { supabase } from '../supabase'
import type { Workout } from '../types'

interface HistoryWorkout extends Workout {
  exerciseCount: number
  setCount: number
  volume: number
}

export default function History() {
  const [workouts, setWorkouts] = useState<HistoryWorkout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkouts()
  }, [])

  async function loadWorkouts() {
    const { data } = await supabase
      .from('workouts')
      .select('*, workout_exercises(id, workout_sets(reps, weight_kg))')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (data) {
      setWorkouts(
        data.map((w) => {
          const exs = w.workout_exercises as { id: string; workout_sets: { reps: number; weight_kg: number }[] }[] | undefined
          const exerciseCount = exs?.length ?? 0
          const setCount = exs ? exs.reduce((sum, we) => sum + we.workout_sets.length, 0) : 0
          const volume = exs
            ? exs.reduce((sum, we) => sum + we.workout_sets.reduce((s, set) => s + set.reps * set.weight_kg, 0), 0)
            : 0
          return { ...w, exerciseCount, setCount, volume }
        })
      )
    }
    setLoading(false)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }

  function formatVolume(vol: number) {
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`
    return Math.round(vol).toString()
  }

  function groupByDate(items: HistoryWorkout[]) {
    const groups: Record<string, HistoryWorkout[]> = {}
    for (const w of items) {
      const key = w.completed_at ? new Date(w.completed_at).toDateString() : 'Unknown'
      if (!groups[key]) groups[key] = []
      groups[key].push(w)
    }
    return groups
  }

  const grouped = groupByDate(workouts)

  return (
    <div className="px-5 pt-10 pb-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-white">History</h1>
        <p className="text-slate-500 text-sm mt-0.5">{workouts.length} workouts logged</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Calendar size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No workouts completed yet</p>
          <Link to="/workout" className="text-green-500 text-sm mt-2 inline-block hover:text-green-400">
            Start your first workout
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {formatDate(items[0].completed_at!)}
              </p>
              <div className="space-y-2">
                {items.map((w) => (
                  <Link
                    key={w.id}
                    to={`/history/${w.id}`}
                    className="flex items-center gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-600/15 rounded-lg flex items-center justify-center shrink-0">
                      <Dumbbell size={17} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{w.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {w.exerciseCount} exercises &middot; {w.setCount} sets &middot; {formatVolume(w.volume)} kg
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
