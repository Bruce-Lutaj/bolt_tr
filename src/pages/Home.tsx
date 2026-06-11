import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Dumbbell, TrendingUp, Calendar, Flame, Play, ChevronRight, RotateCcw, LogOut } from 'lucide-react'
import { useHomeStats, useRepeatWorkout, useElapsedTime, getDraftSummary } from '../features/workouts'
import { useAuth } from '../features/auth'
import { ROUTES } from '../shared/routes'
import { formatDate, formatVolume } from '../shared/formatters'
import { LoadingSpinner, StatCard, EmptyState, InlineError } from '../components/ui'

export default function Home() {
  const { recentWorkouts, stats, loading, error } = useHomeStats()
  const { repeat } = useRepeatWorkout()
  const { logout } = useAuth()
  const [draftSummary] = useState(getDraftSummary())
  const elapsed = useElapsedTime(draftSummary?.startedAt ?? null)

  return (
    <div className="px-5 pt-10 pb-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">GymTrack</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your personal workout companion</p>
        </div>
        <button
          onClick={logout}
          className="p-2 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-800"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </header>

      <InlineError error={error} className="mb-4" />

      {draftSummary ? (
        <Link
          to={ROUTES.workout}
          className="flex items-center justify-between w-full p-4 mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg transition-colors hover:bg-amber-500/15 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Play size={18} className="text-amber-400 ml-0.5" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Workout in progress</p>
              <p className="text-xs text-amber-400/80 mt-0.5">
                {elapsed} &middot; {draftSummary.exerciseCount} exercises &middot; {draftSummary.setCount} sets
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-amber-400/60" />
        </Link>
      ) : (
        <Link
          to={ROUTES.workout}
          className="flex items-center justify-center gap-2.5 w-full py-4 mb-6 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors active:scale-[0.98] transform"
        >
          <Dumbbell size={20} />
          Start Workout
        </Link>
      )}

      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <StatCard
          icon={<Flame size={16} className="text-orange-400" />}
          value={stats.thisWeek.toString()}
          label="This Week"
        />
        <StatCard
          icon={<Calendar size={16} className="text-sky-400" />}
          value={stats.totalWorkouts.toString()}
          label="Total"
        />
        <StatCard
          icon={<TrendingUp size={16} className="text-green-400" />}
          value={formatVolume(stats.totalVolume)}
          label="Volume"
        />
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Recent Workouts
        </h2>
        {loading ? (
          <LoadingSpinner className="flex justify-center py-8" />
        ) : recentWorkouts.length === 0 ? (
          <EmptyState
            icon={<Dumbbell size={28} />}
            message="No workouts yet. Start your first one!"
          />
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 p-3.5 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <Link to={ROUTES.workoutDetail(w.id)} className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{w.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {w.completed_at ? formatDate(w.completed_at) : ''}
                  </p>
                </Link>
                <button
                  onClick={() => repeat(w.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-400 hover:text-green-300 bg-green-600/10 hover:bg-green-600/20 rounded-md transition-colors"
                  title="Repeat this workout"
                >
                  <RotateCcw size={12} />
                  Repeat
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
