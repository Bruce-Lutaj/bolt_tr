import { NavLink, useNavigate } from 'react-router-dom'
import { Hop as Home, Dumbbell, ChartBar as BarChart3, Clock, ListChecks } from 'lucide-react'
import { hasDraft } from '../lib/workoutDraft'

const leftItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
]

const rightItems = [
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/exercises', icon: ListChecks, label: 'Exercises' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const draftActive = hasDraft()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 relative">
        {leftItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                isActive ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          onClick={() => navigate('/workout')}
          className="relative flex items-center justify-center w-14 h-14 -mt-5 bg-green-600 hover:bg-green-500 active:scale-95 rounded-full shadow-lg shadow-green-600/30 transition-all"
        >
          <Dumbbell size={22} className="text-white" strokeWidth={2.5} />
          {draftActive && (
            <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-slate-900 animate-pulse" />
          )}
        </button>

        {rightItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 transition-colors ${
                isActive ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
