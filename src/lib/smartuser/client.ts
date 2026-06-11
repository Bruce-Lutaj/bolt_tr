const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const SESSION_KEY = 'gymtrack.smartuser.session'

export interface SmartUserSessionData {
  userId: string
  email: string
  token?: string
}

function readSession(): SmartUserSessionData | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SmartUserSessionData
  } catch {
    return null
  }
}

function writeSession(session: SmartUserSessionData): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

async function callEdgeFunction(
  functionName: string,
  body: Record<string, unknown>
): Promise<{ data: SmartUserSessionData | null; error: string | null }> {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' }
  }

  const json = await response.json()

  if (!response.ok) {
    return { data: null, error: json.error ?? `Request failed (${response.status})` }
  }

  if (!json.userId) {
    return { data: null, error: 'Server did not return a valid user identity' }
  }

  return {
    data: { userId: json.userId, email: json.email, token: json.token },
    error: null,
  }
}

export async function smartUserLogin(
  email: string,
  password: string
): Promise<{ userId: string | null; error: string | null }> {
  const { data, error } = await callEdgeFunction('smartuser-login', { email, password })
  if (error || !data) {
    return { userId: null, error: error ?? 'Login failed' }
  }
  writeSession(data)
  return { userId: data.userId, error: null }
}

export async function smartUserSignup(
  email: string,
  password: string
): Promise<{ userId: string | null; error: string | null }> {
  const { data, error } = await callEdgeFunction('smartuser-signup', { email, password })
  if (error || !data) {
    return { userId: null, error: error ?? 'Signup failed' }
  }
  writeSession(data)
  return { userId: data.userId, error: null }
}

export async function smartUserLogout(): Promise<void> {
  clearSession()
}

export function getSmartUserSession(): SmartUserSessionData | null {
  return readSession()
}

export function getSmartUserId(): string | null {
  const session = readSession()
  return session?.userId ?? null
}
