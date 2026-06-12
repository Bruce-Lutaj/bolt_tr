import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getSmartUserSession } from './smartuser';

const AUTH_MODE_KEY = 'gymtrack.authMode';

export type AuthProvider = 'guest' | 'supabase' | 'smartuser';

export interface AccountIdentity {
  provider: AuthProvider;
  accountId: string | null;
}

export async function getActiveAccountIdentity(): Promise<AccountIdentity> {
  const mode = await AsyncStorage.getItem(AUTH_MODE_KEY);

  if (mode === 'guest') {
    return { provider: 'guest', accountId: 'guest' };
  }

  if (mode === 'smartuser') {
    const session = await getSmartUserSession();
    return { provider: 'smartuser', accountId: session?.userId ?? null };
  }

  const { data: { session } } = await supabase.auth.getSession();
  return { provider: 'supabase', accountId: session?.user?.id ?? null };
}
