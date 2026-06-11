import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { signUp, signIn, signOut } from '../api/authApi'
import {
  smartUserLogin as suLogin,
  smartUserSignup as suSignup,
  smartUserLogout as suLogout,
  getSmartUserSession,
  initSmartUser,
} from '../api/smartUserAuthApi'
import type { User } from '@supabase/supabase-js'

const AUTH_MODE_KEY = 'gymtrack.authMode'

export type AuthProvider = 'supabase' | 'smartuser' | 'guest'

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
  provider: AuthProvider
}

export interface SignupResult {
  error: string | null
  needsConfirmation: boolean
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  isGuest: boolean
  provider: AuthProvider | null
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<string | null>
  signup: (email: string, password: string, displayName?: string) => Promise<SignupResult>
  loginWithSmartUser: (email: string, password: string) => Promise<string | null>
  signupWithSmartUser: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  enterGuest: () => void
}

const GUEST_USER: AuthUser = { id: 'guest', email: '', displayName: 'Guest', provider: 'guest' }

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: user.user_metadata?.display_name ?? null,
    provider: 'supabase',
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProviderComponent({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const savedMode = localStorage.getItem(AUTH_MODE_KEY) as AuthProvider | null
    if (savedMode === 'guest') {
      return { user: GUEST_USER, loading: false, isGuest: true, provider: 'guest' }
    }
    if (savedMode === 'smartuser') {
      const session = getSmartUserSession()
      if (session && session.logged) {
        return {
          user: { id: session.userId, email: session.email, displayName: null, provider: 'smartuser' },
          loading: false,
          isGuest: false,
          provider: 'smartuser',
        }
      }
      localStorage.removeItem(AUTH_MODE_KEY)
    }
    return { user: null, loading: true, isGuest: false, provider: null }
  })

  useEffect(() => {
    initSmartUser()
  }, [])

  useEffect(() => {
    if (state.isGuest || state.provider === 'smartuser') return

    let ignore = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (ignore) return
      setState((prev) => {
        if (prev.isGuest || prev.provider === 'smartuser') return prev
        return {
          user: session?.user ? toAuthUser(session.user) : null,
          loading: false,
          isGuest: false,
          provider: session?.user ? 'supabase' : null,
        }
      })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ignore) return
      setState((prev) => {
        if (prev.isGuest || prev.provider === 'smartuser') return prev
        return {
          user: session?.user ? toAuthUser(session.user) : null,
          loading: false,
          isGuest: false,
          provider: session?.user ? 'supabase' : null,
        }
      })
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [state.isGuest, state.provider])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await signIn(email, password)
    if (!error) {
      localStorage.removeItem(AUTH_MODE_KEY)
      setState((prev) => ({ ...prev, isGuest: false, provider: 'supabase' }))
    }
    return error
  }, [])

  const signup = useCallback(async (email: string, password: string, displayName?: string): Promise<SignupResult> => {
    const { session, error } = await signUp(email, password, displayName)
    if (error) return { error, needsConfirmation: false }
    if (!session) return { error: null, needsConfirmation: true }
    localStorage.removeItem(AUTH_MODE_KEY)
    setState((prev) => ({ ...prev, isGuest: false, provider: 'supabase' }))
    return { error: null, needsConfirmation: false }
  }, [])

  const loginWithSmartUser = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { userId, error } = await suLogin(email, password)
    if (error || !userId) return error ?? 'Login failed'
    localStorage.setItem(AUTH_MODE_KEY, 'smartuser')
    setState({
      user: { id: userId, email, displayName: null, provider: 'smartuser' },
      loading: false,
      isGuest: false,
      provider: 'smartuser',
    })
    return null
  }, [])

  const signupWithSmartUser = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { userId, error } = await suSignup(email, password)
    if (error || !userId) return error ?? 'Signup failed'
    localStorage.setItem(AUTH_MODE_KEY, 'smartuser')
    setState({
      user: { id: userId, email, displayName: null, provider: 'smartuser' },
      loading: false,
      isGuest: false,
      provider: 'smartuser',
    })
    return null
  }, [])

  const logout = useCallback(async () => {
    const currentProvider = state.provider
    if (currentProvider === 'guest') {
      localStorage.removeItem(AUTH_MODE_KEY)
      setState({ user: null, loading: false, isGuest: false, provider: null })
    } else if (currentProvider === 'smartuser') {
      await suLogout()
      localStorage.removeItem(AUTH_MODE_KEY)
      setState({ user: null, loading: false, isGuest: false, provider: null })
    } else {
      await signOut()
      localStorage.removeItem(AUTH_MODE_KEY)
      setState({ user: null, loading: false, isGuest: false, provider: null })
    }
  }, [state.provider])

  const enterGuest = useCallback(() => {
    localStorage.setItem(AUTH_MODE_KEY, 'guest')
    setState({ user: GUEST_USER, loading: false, isGuest: true, provider: 'guest' })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, signup, loginWithSmartUser, signupWithSmartUser, logout, enterGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
