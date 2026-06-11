import { SmartUserRN } from '@digitalvirgo/su-bolt-react'
import { createWebSmartUserAsyncStorage, getWebPlatformConfig } from '@digitalvirgo/su-bolt-react/web-adapter'

const APP_ID = import.meta.env.VITE_BOLT_APP_ID || 'gymtrack.bolt.app'
const APP_SECRET = import.meta.env.VITE_BOLT_APP_SECRET || ''
const BOLT_ENV = (import.meta.env.VITE_BOLT_ENV || 'STAG') as 'PROD' | 'STAG'

export const smartUser = SmartUserRN.getInstance({
  ...getWebPlatformConfig(),
  AsyncStorage: createWebSmartUserAsyncStorage(),
  fetch: window.fetch.bind(window),
  applicationId: APP_ID,
  origin: window.location.origin,
  env: BOLT_ENV,
  debug: import.meta.env.DEV,
  locale: navigator.language,
})

export async function initSmartUser(): Promise<void> {
  await smartUser.setup(APP_SECRET, {
    applicationIdOverride: APP_ID,
    env: BOLT_ENV,
  })
}

export function getSmartUser() {
  return smartUser
}
