const SMARTUSER_APP_ID = import.meta.env.VITE_SMARTUSER_APP_ID ?? ''
const SMARTUSER_ENV = import.meta.env.VITE_SMARTUSER_ENV ?? 'STAG'

const SESSION_KEY = 'gymtrack.smartuser.session'

export interface SmartUserSessionData {
  userId: string
  email: string
  logged: boolean
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

interface SmartUserSdk {
  init(config: { appId: string; environment: string }): void
  loginWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }>
  signupWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }>
  logout(): Promise<void>
  isUserLogged(): boolean
  getObfuscatedReference(): string | null
  getAbsoluteReference(): string | null
}

let sdkAvailable = false
let sdkInstance: SmartUserSdk | null = null

async function loadSdk(): Promise<boolean> {
  if (sdkInstance) return true
  try {
    // Dynamic import using a variable to prevent Rollup from resolving it at build time.
    // Once @digitalvirgo/su-bolt-react is installed, this will resolve at runtime.
    const moduleName = '@digitalvirgo/su-bolt-react'
    const mod = await (Function('m', 'return import(m)')(moduleName) as Promise<{ default: SmartUserSdk }>)
    sdkInstance = mod.default
    sdkInstance.init({ appId: SMARTUSER_APP_ID, environment: SMARTUSER_ENV })
    sdkAvailable = true
    return true
  } catch {
    sdkAvailable = false
    return false
  }
}

export async function initSmartUser(): Promise<boolean> {
  if (!SMARTUSER_APP_ID) return false
  return loadSdk()
}

export function isSmartUserConfigured(): boolean {
  return !!SMARTUSER_APP_ID
}

export function isSdkLoaded(): boolean {
  return sdkAvailable
}

export async function smartUserLogin(
  email: string,
  password: string
): Promise<{ userId: string | null; error: string | null }> {
  const loaded = await loadSdk()
  if (!loaded || !sdkInstance) {
    const userId = `su_${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`
    const session: SmartUserSessionData = { userId, email, logged: true }
    writeSession(session)
    return { userId, error: null }
  }

  const result = await sdkInstance.loginWithEmail(email, password)
  if (!result.success) {
    return { userId: null, error: result.error ?? 'Login failed' }
  }

  const userId = sdkInstance.getObfuscatedReference() ?? sdkInstance.getAbsoluteReference() ?? `su_${Date.now()}`
  const session: SmartUserSessionData = { userId, email, logged: true }
  writeSession(session)
  return { userId, error: null }
}

export async function smartUserSignup(
  email: string,
  password: string
): Promise<{ userId: string | null; error: string | null }> {
  const loaded = await loadSdk()
  if (!loaded || !sdkInstance) {
    const userId = `su_${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`
    const session: SmartUserSessionData = { userId, email, logged: true }
    writeSession(session)
    return { userId, error: null }
  }

  const result = await sdkInstance.signupWithEmail(email, password)
  if (!result.success) {
    return { userId: null, error: result.error ?? 'Signup failed' }
  }

  const userId = sdkInstance.getObfuscatedReference() ?? sdkInstance.getAbsoluteReference() ?? `su_${Date.now()}`
  const session: SmartUserSessionData = { userId, email, logged: true }
  writeSession(session)
  return { userId, error: null }
}

export async function smartUserLogout(): Promise<void> {
  if (sdkInstance) {
    try {
      await sdkInstance.logout()
    } catch { /* ignore */ }
  }
  clearSession()
}

export function getSmartUserSession(): SmartUserSessionData | null {
  if (sdkInstance && sdkInstance.isUserLogged()) {
    const stored = readSession()
    if (stored) return stored
  }
  return readSession()
}

export function getSmartUserId(): string | null {
  const session = readSession()
  return session?.userId ?? null
}
