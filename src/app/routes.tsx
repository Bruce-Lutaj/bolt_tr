import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../shared/routes'
import { useAuth } from '../features/auth'
import { LoadingSpinner } from '../components/ui'
import Home from '../pages/Home'
import NewWorkout from '../pages/NewWorkout'
import Analytics from '../pages/Analytics'
import History from '../pages/History'
import WorkoutDetail from '../pages/WorkoutDetail'
import Exercises from '../pages/Exercises'
import Login from '../pages/Login'

function AppAccessRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner className="flex justify-center items-center min-h-[60vh]" />
  }

  if (!user) {
    return <Navigate to={ROUTES.login} replace />
  }

  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner className="flex justify-center items-center min-h-[60vh]" />
  }

  if (user) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path={ROUTES.home} element={<AppAccessRoute><Home /></AppAccessRoute>} />
      <Route path={ROUTES.workout} element={<AppAccessRoute><NewWorkout /></AppAccessRoute>} />
      <Route path={ROUTES.progress} element={<AppAccessRoute><Analytics /></AppAccessRoute>} />
      <Route path={ROUTES.history} element={<AppAccessRoute><History /></AppAccessRoute>} />
      <Route path="/history/:id" element={<AppAccessRoute><WorkoutDetail /></AppAccessRoute>} />
      <Route path={ROUTES.exercises} element={<AppAccessRoute><Exercises /></AppAccessRoute>} />
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  )
}
