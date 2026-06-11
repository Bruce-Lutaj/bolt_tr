export const ROUTES = {
  home: '/',
  workout: '/workout',
  progress: '/progress',
  history: '/history',
  workoutDetail: (id: string) => `/history/${id}`,
  exercises: '/exercises',
  login: '/login',
} as const

export interface NavItem {
  to: string
  label: string
  icon: string
}

export const NAV_LEFT_ITEMS: NavItem[] = [
  { to: ROUTES.home, label: 'Home', icon: 'Home' },
  { to: ROUTES.progress, label: 'Progress', icon: 'BarChart3' },
]

export const NAV_RIGHT_ITEMS: NavItem[] = [
  { to: ROUTES.history, label: 'History', icon: 'Clock' },
  { to: ROUTES.exercises, label: 'Exercises', icon: 'ListChecks' },
]
