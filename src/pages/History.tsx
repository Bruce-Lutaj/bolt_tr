import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Dumbbell } from 'lucide-react'
import { supabase } from '../supabase'
import type { Workout } from '../types'

export default function History() {
  const [workouts, setWorkouts] = useState<(Workout & { setCount: number })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkouts()
  }, [])

  async function loadWorkouts() {
    const { data } = await supabase
      .from('workouts')
      .select('*, workout_sets(id)')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    if (data) {
      setWorkouts(
        data.map((w) => ({
          ...w,
          setCount: Array.isArray(w.workout_sets) ? w.workout_sets.length : 0,
        }))
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

  function groupByDate(items: typeof workouts) {
    const groups: Record<string, typeof workouts> = {}
    for (const w of items) {
      const key = w.completed_at ? new Date(w.completed_at).toDateString() : 'Unknown'
      if (!groups[key]) groups[key] = []
      groups[key].push(w)
    }
    return groups
  }

  const grouped = groupByDate(workouts)

  return (
    <div className="px-5 pt-12 pb-6">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-white">Workout History</h1>
        <p className="text-slate-500 text-sm mt-1">{workouts.length} workouts logged</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Calendar size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No workouts completed yet</p>
          <Link to="/workout" className="text-green-500 text-sm mt-2 inline-block hover:text-green-400">
            Start your first workout
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {formatDate(items[0].completed_at!)}
              </p>
              <div className="space-y-2">
                {items.map((w) => (
                  <Link
                    key={w.id}
                    to={`/history/${w.id}`}
                    className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                        <Dumbbell size={18} className="text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{w.name}</p>
                        <p className="text-xs text-slate-500">{w.setCount} sets</p>
                      </div>
                    </div>
                    <span className="text-slate-600 text-xs">&rarr;</span>
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
