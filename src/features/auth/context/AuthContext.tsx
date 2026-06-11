import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { smartUser, initSmartUser } from '../../../lib/smartuser/client'

interface AuthState {
  isLoggedIn: boolean
  loading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<string | null>
  signup: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        await initSmartUser()
        const logged = smartUser.isUserLogged()
        if (mounted) setState({ isLoggedIn: logged, loading: false, error: null })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'SDK setup failed'
        if (mounted) setState({ isLoggedIn: false, loading: false, error: message })
      }
    }

    init()

    const handleStatusChange = () => {
      if (mounted) {
        setState((prev) => ({ ...prev, isLoggedIn: smartUser.isUserLogged() }))
      }
    }
    smartUser.on('user-status-did-change', handleStatusChange)

    return () => {
      mounted = false
      smartUser.removeListener('user-status-did-change', handleStatusChange)
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      await smartUser.loginWithEmail(email, password)
      setState((prev) => ({ ...prev, isLoggedIn: true, error: null }))
      return null
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setState((prev) => ({ ...prev, error: message }))
      return message
    }
  }, [])

  const signup = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      await smartUser.signupWithEmail(email, password)
      setState((prev) => ({ ...prev, isLoggedIn: true, error: null }))
      return null
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed'
      setState((prev) => ({ ...prev, error: message }))
      return message
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await smartUser.logout()
      setState({ isLoggedIn: false, loading: false, error: null })
    } catch {
      setState({ isLoggedIn: false, loading: false, error: null })
    }
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
