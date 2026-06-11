import { AuthProvider, useAuth } from '../features/auth'
import BottomNav from '../components/BottomNav'
import { AppRoutes } from './routes'

function AppContent() {
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      <main className="flex-1 pb-20 overflow-y-auto">
        <AppRoutes />
      </main>
      {!loading && user && <BottomNav />}
    </div>
  )
}

export function AppShell() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
