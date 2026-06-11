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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner className="flex justify-center items-center min-h-[60vh]" />
  }

  if (!isLoggedIn) {
    return <Navigate to={ROUTES.login} replace />
  }

  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner className="flex justify-center items-center min-h-[60vh]" />
  }

  if (isLoggedIn) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path={ROUTES.home} element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path={ROUTES.workout} element={<ProtectedRoute><NewWorkout /></ProtectedRoute>} />
      <Route path={ROUTES.progress} element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path={ROUTES.history} element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/history/:id" element={<ProtectedRoute><WorkoutDetail /></ProtectedRoute>} />
      <Route path={ROUTES.exercises} element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  )
}
