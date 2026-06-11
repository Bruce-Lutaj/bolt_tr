import { Link } from 'react-router-dom'
import { Calendar, Dumbbell, ChevronRight } from 'lucide-react'
import { useWorkoutHistory } from '../features/workouts'
import { ROUTES } from '../shared/routes'
import { formatDateGrouped, formatVolume } from '../shared/formatters'
import { LoadingSpinner, EmptyState, InlineError } from '../components/ui'

export default function History() {
  const { workouts, loading, error } = useWorkoutHistory()

  function groupByDate(items: typeof workouts) {
    const groups: Record<string, typeof workouts> = {}
    for (const w of items) {
      const key = new Date(w.completed_at).toDateString()
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

      <InlineError error={error} className="mb-4" />

      {loading ? (
        <LoadingSpinner />
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={<Calendar size={28} />}
          message="No workouts completed yet"
          actionLabel="Start your first workout"
          actionTo={ROUTES.workout}
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                {formatDateGrouped(items[0].completed_at)}
              </p>
              <div className="space-y-2">
                {items.map((w) => (
                  <Link
                    key={w.id}
                    to={ROUTES.workoutDetail(w.id)}
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
