import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { signUp, signIn, signOut } from '../api/authApi'
import type { User } from '@supabase/supabase-js'

const AUTH_MODE_KEY = 'gymtrack.authMode'

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
}

export interface SignupResult {
  error: string | null
  needsConfirmation: boolean
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  isGuest: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<string | null>
  signup: (email: string, password: string, displayName?: string) => Promise<SignupResult>
  logout: () => Promise<void>
  enterGuest: () => void
}

const GUEST_USER: AuthUser = { id: 'guest', email: '', displayName: 'Guest' }

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: user.user_metadata?.display_name ?? null,
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const savedMode = localStorage.getItem(AUTH_MODE_KEY)
    if (savedMode === 'guest') {
      return { user: GUEST_USER, loading: false, isGuest: true }
    }
    return { user: null, loading: true, isGuest: false }
  })

  useEffect(() => {
    if (state.isGuest) return

    let ignore = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (ignore) return
      setState((prev) => {
        if (prev.isGuest) return prev
        return { user: session?.user ? toAuthUser(session.user) : null, loading: false, isGuest: false }
      })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ignore) return
      setState((prev) => {
        if (prev.isGuest) return prev
        return { user: session?.user ? toAuthUser(session.user) : null, loading: false, isGuest: false }
      })
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [state.isGuest])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await signIn(email, password)
    if (!error) {
      localStorage.removeItem(AUTH_MODE_KEY)
      setState((prev) => ({ ...prev, isGuest: false }))
    }
    return error
  }, [])

  const signup = useCallback(async (email: string, password: string, displayName?: string): Promise<SignupResult> => {
    const { session, error } = await signUp(email, password, displayName)
    if (error) return { error, needsConfirmation: false }
    if (!session) return { error: null, needsConfirmation: true }
    localStorage.removeItem(AUTH_MODE_KEY)
    setState((prev) => ({ ...prev, isGuest: false }))
    return { error: null, needsConfirmation: false }
  }, [])

  const logout = useCallback(async () => {
    if (state.isGuest) {
      localStorage.removeItem(AUTH_MODE_KEY)
      setState({ user: null, loading: false, isGuest: false })
    } else {
      await signOut()
      setState({ user: null, loading: false, isGuest: false })
    }
  }, [state.isGuest])

  const enterGuest = useCallback(() => {
    localStorage.setItem(AUTH_MODE_KEY, 'guest')
    setState({ user: GUEST_USER, loading: false, isGuest: true })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, enterGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
