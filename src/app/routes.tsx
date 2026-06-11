import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '../shared/routes'
import Home from '../pages/Home'
import NewWorkout from '../pages/NewWorkout'
import Analytics from '../pages/Analytics'
import History from '../pages/History'
import WorkoutDetail from '../pages/WorkoutDetail'
import Exercises from '../pages/Exercises'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<Home />} />
      <Route path={ROUTES.workout} element={<NewWorkout />} />
      <Route path={ROUTES.progress} element={<Analytics />} />
      <Route path={ROUTES.history} element={<History />} />
      <Route path="/history/:id" element={<WorkoutDetail />} />
      <Route path={ROUTES.exercises} element={<Exercises />} />
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  )
}
