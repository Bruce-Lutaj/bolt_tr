declare module '@digitalvirgo/su-bolt-react' {
  interface SmartUserConfig {
    appId: string
    environment: string
    appSecret?: string
  }

  interface SmartUserSession {
    logged: boolean
    userId: string | null
    email: string | null
  }

  interface SmartUserInstance {
    init(config: SmartUserConfig): void
    loginWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }>
    signupWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }>
    logout(): Promise<void>
    isUserLogged(): boolean
    getObfuscatedReference(): string | null
    getAbsoluteReference(): string | null
    getSession(): SmartUserSession
  }

  const SmartUser: SmartUserInstance
  export default SmartUser
}
