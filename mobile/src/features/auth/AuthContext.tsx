import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import {
  smartUserLogin as suLogin,
  smartUserSignup as suSignup,
  smartUserLogout as suLogout,
  validateSmartUserSession,
  getSmartUserSession,
} from '../../lib/smartuser';
import type { User } from '@supabase/supabase-js';

const AUTH_MODE_KEY = 'gymtrack.authMode';

export type AuthProviderType = 'supabase' | 'smartuser' | 'guest';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  provider: AuthProviderType;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isGuest: boolean;
  provider: AuthProviderType | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string, displayName?: string) => Promise<string | null>;
  loginWithSmartUser: (email: string, password: string) => Promise<string | null>;
  signupWithSmartUser: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  enterGuest: () => void;
}

const GUEST_USER: AuthUser = { id: 'guest', email: '', displayName: 'Guest', provider: 'guest' };

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: user.user_metadata?.display_name ?? null,
    provider: 'supabase',
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProviderComponent({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isGuest: false,
    provider: null,
  });

  useEffect(() => {
    let ignore = false;
    async function init() {
      const savedMode = await AsyncStorage.getItem(AUTH_MODE_KEY);

      if (savedMode === 'guest') {
        if (!ignore) setState({ user: GUEST_USER, loading: false, isGuest: true, provider: 'guest' });
        return;
      }

      if (savedMode === 'smartuser') {
        const session = await getSmartUserSession();
        if (session) {
          const { valid, session: validSession } = await validateSmartUserSession();
          if (!ignore) {
            if (valid && validSession) {
              setState({
                user: { id: validSession.userId, email: validSession.email, displayName: null, provider: 'smartuser' },
                loading: false, isGuest: false, provider: 'smartuser',
              });
            } else {
              await AsyncStorage.removeItem(AUTH_MODE_KEY);
              setState({ user: null, loading: false, isGuest: false, provider: null });
            }
          }
          return;
        }
        await AsyncStorage.removeItem(AUTH_MODE_KEY);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!ignore) {
        setState({
          user: session?.user ? toAuthUser(session.user) : null,
          loading: false, isGuest: false,
          provider: session?.user ? 'supabase' : null,
        });
      }
    }
    init();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (state.isGuest || state.provider === 'smartuser') return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => {
        if (prev.isGuest || prev.provider === 'smartuser') return prev;
        return {
          user: session?.user ? toAuthUser(session.user) : null,
          loading: false, isGuest: false,
          provider: session?.user ? 'supabase' : null,
        };
      });
    });
    return () => { subscription.unsubscribe(); };
  }, [state.isGuest, state.provider]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      await AsyncStorage.removeItem(AUTH_MODE_KEY);
      setState((prev) => ({ ...prev, isGuest: false, provider: 'supabase' }));
    }
    return error?.message ?? null;
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName?: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: displayName ? { data: { display_name: displayName } } : undefined,
    });
    if (error) return error.message;
    if (!data.session) return 'Check your email to confirm your account.';
    await AsyncStorage.removeItem(AUTH_MODE_KEY);
    return null;
  }, []);

  const loginWithSmartUser = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { userId, error } = await suLogin(email, password);
    if (error || !userId) return error ?? 'Login failed';
    await AsyncStorage.setItem(AUTH_MODE_KEY, 'smartuser');
    setState({ user: { id: userId, email, displayName: null, provider: 'smartuser' }, loading: false, isGuest: false, provider: 'smartuser' });
    return null;
  }, []);

  const signupWithSmartUser = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { userId, error } = await suSignup(email, password);
    if (error || !userId) return error ?? 'Signup failed';
    await AsyncStorage.setItem(AUTH_MODE_KEY, 'smartuser');
    setState({ user: { id: userId, email, displayName: null, provider: 'smartuser' }, loading: false, isGuest: false, provider: 'smartuser' });
    return null;
  }, []);

  const logout = useCallback(async () => {
    if (state.provider === 'smartuser') await suLogout();
    else if (state.provider === 'supabase') await supabase.auth.signOut();
    await AsyncStorage.removeItem(AUTH_MODE_KEY);
    setState({ user: null, loading: false, isGuest: false, provider: null });
  }, [state.provider]);

  const enterGuest = useCallback(async () => {
    await AsyncStorage.setItem(AUTH_MODE_KEY, 'guest');
    setState({ user: GUEST_USER, loading: false, isGuest: true, provider: 'guest' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, loginWithSmartUser, signupWithSmartUser, logout, enterGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
