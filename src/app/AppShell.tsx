import BottomNav from '../components/BottomNav'
import { AppRoutes } from './routes'

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      <main className="flex-1 pb-20 overflow-y-auto">
        <AppRoutes />
      </main>
      <BottomNav />
    </div>
  )
}
