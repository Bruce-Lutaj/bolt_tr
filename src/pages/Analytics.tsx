import { Trophy, Target, TrendingUp, Zap } from 'lucide-react'
import { useAnalytics } from '../features/analytics'
import { formatShortDate } from '../shared/formatters'
import { LoadingSpinner, StatCard, InlineError } from '../components/ui'

export default function Analytics() {
  const {
    weeklyData,
    exerciseOptions,
    exerciseProgress,
    personalBests,
    kpis,
    selectedExercise,
    setSelectedExercise,
    loading,
    error,
    totalWorkouts,
    hasData,
  } = useAnalytics()

  if (loading) {
    return <LoadingSpinner className="flex justify-center items-center h-64" />
  }

  return (
    <div className="px-5 pt-10 pb-6">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-white">Progress</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track your gains over time</p>
      </header>

      <InlineError error={error} className="mb-4" />

      {!hasData ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">Complete some workouts to see your progress here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-2">
            <StatCard size="sm" icon={<Target size={14} className="text-sky-400" />} value={totalWorkouts.toString()} label="Workouts" />
            <StatCard size="sm" icon={<Zap size={14} className="text-amber-400" />} value={`${kpis.streak}w`} label="Streak" />
            <StatCard size="sm" icon={<Trophy size={14} className="text-green-400" />} value={`${kpis.heaviestLift}`} label="Max (kg)" />
            <StatCard size="sm" icon={<TrendingUp size={14} className="text-orange-400" />} value={kpis.topMuscle} label="Top Group" />
          </div>

          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5">
              Weekly Workouts
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              {weeklyData.length < 2 ? (
                <p className="text-slate-500 text-sm text-center py-4">Need at least 2 weeks of data</p>
              ) : (
                <BarChart
                  data={weeklyData.map((w) => ({ label: w.label, value: w.count }))}
                  color="#4ade80"
                  unit="workouts"
                />
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5">
              Weekly Volume
            </h2>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              {weeklyData.length < 2 ? (
                <p className="text-slate-500 text-sm text-center py-4">Need at least 2 weeks of data</p>
              ) : (
                <BarChart
                  data={weeklyData.map((w) => ({ label: w.label, value: Math.round(w.volume) }))}
                  color="#38bdf8"
                  unit="kg"
                />
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5">
              Exercise Progress
            </h2>
            <select
              value={selectedExercise || ''}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-sm mb-2.5 focus:outline-none focus:border-green-600 appearance-none"
            >
              {exerciseOptions.map((e) => (
                <option key={e.key} value={e.key}>{e.name}</option>
              ))}
            </select>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              {exerciseProgress.length < 2 ? (
                <p className="text-slate-500 text-sm text-center py-4">Need at least 2 sessions to chart</p>
              ) : (
                <>
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-[10px] text-slate-500 uppercase">Current max</span>
                    <span className="text-sm font-bold text-green-400">
                      {exerciseProgress[exerciseProgress.length - 1].maxWeight} kg
                    </span>
                  </div>
                  <LineChart
                    data={exerciseProgress.map((p) => ({
                      label: formatShortDate(p.date),
                      value: p.maxWeight,
                    }))}
                  />
                </>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5">
              Personal Bests
            </h2>
            <div className="space-y-1.5">
              {personalBests.map((pb) => (
                <div key={pb.key} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">{pb.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{pb.group}</p>
                  </div>
                  <p className="text-sm font-bold text-green-400">{pb.weight} kg</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function BarChart({ data, color, unit }: { data: { label: string; value: number }[]; color: string; unit: string }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <div>
      <div className="flex items-end justify-between gap-1.5 h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <span className="text-[9px] text-slate-400 mb-1 font-medium">{d.value}</span>
            <div
              className="w-full rounded-t min-h-[4px]"
              style={{
                height: `${(d.value / maxValue) * 100}%`,
                backgroundColor: color,
                opacity: 0.6 + (i / data.length) * 0.4,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-1.5 mt-2 border-t border-slate-800 pt-2">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-[8px] text-slate-600 text-center truncate">{d.label}</span>
        ))}
      </div>
      <p className="text-[9px] text-slate-600 text-right mt-0.5">{unit}</p>
    </div>
  )
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const height = 100
  const width = 280
  const pad = 8

  const points = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (d.value - min) / range) * (height - pad * 2),
  }))

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
        <defs>
          <linearGradient id="areaFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaFill)" />
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#22c55e" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-slate-500">{data[0].label}</span>
        <span className="text-[9px] text-slate-500">{data[data.length - 1].label}</span>
      </div>
    </div>
  )
}
