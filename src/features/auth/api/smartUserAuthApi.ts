import {
  smartUserLogin as clientLogin,
  smartUserSignup as clientSignup,
  smartUserLogout as clientLogout,
  validateSmartUserSession as clientValidate,
  getSmartUserSession,
  getSmartUserId,
} from '../../../lib/smartuser/client'

export { getSmartUserId, getSmartUserSession, clientValidate as validateSmartUserSession }

export async function smartUserLogin(
  email: string,
  password: string
): Promise<{ userId: string | null; error: string | null }> {
  return clientLogin(email, password)
}

export async function smartUserSignup(
  email: string,
  password: string
): Promise<{ userId: string | null; error: string | null }> {
  return clientSignup(email, password)
}

export async function smartUserLogout(): Promise<void> {
  return clientLogout()
}
