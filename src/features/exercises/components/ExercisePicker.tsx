import { X, Search } from 'lucide-react'
import { useExercisePicker } from '../hooks/useExercisePicker'
import { MUSCLE_GROUPS_WITH_ALL } from '../../../shared/constants'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import type { Exercise } from '../types'

interface ExercisePickerProps {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
}

export function ExercisePicker({ onSelect, onClose }: ExercisePickerProps) {
  const {
    recentExercises,
    grouped,
    showRecent,
    loading,
    filtered,
    searchQuery,
    setSearchQuery,
    activeGroup,
    setActiveGroup,
  } = useExercisePicker()

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white">Select Exercise</h2>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-5 py-3 space-y-3 border-b border-slate-800/50">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:border-green-600"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {MUSCLE_GROUPS_WITH_ALL.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                activeGroup === g
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No exercises found</p>
          </div>
        ) : (
          <>
            {showRecent && (
              <div className="mb-5">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Recent
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {recentExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => onSelect(ex)}
                      className="text-left px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white hover:border-green-600 transition-colors truncate"
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {Object.entries(grouped).map(([group, exs]) => (
              <div key={group} className="mb-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {group}
                </p>
                <div className="space-y-1">
                  {exs.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => onSelect(ex)}
                      className="w-full text-left px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white hover:border-green-600 transition-colors"
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
