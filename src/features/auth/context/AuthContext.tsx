import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { signUp, signIn, signOut } from '../api/authApi'
import type { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<string | null>
  signup: (email: string, password: string, displayName?: string) => Promise<string | null>
  logout: () => Promise<void>
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: user.user_metadata?.display_name ?? null,
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    let ignore = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (ignore) return
      setState({ user: session?.user ? toAuthUser(session.user) : null, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (ignore) return
      setState({ user: session?.user ? toAuthUser(session.user) : null, loading: false })
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await signIn(email, password)
    return error
  }, [])

  const signup = useCallback(async (email: string, password: string, displayName?: string): Promise<string | null> => {
    const { error } = await signUp(email, password, displayName)
    return error
  }, [])

  const logout = useCallback(async () => {
    await signOut()
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
