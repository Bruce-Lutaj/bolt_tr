declare module '@digitalvirgo/su-bolt-react' {
  export class SmartUserRN {
    static getInstance(config: {
      AsyncStorage: unknown
      Dimensions: unknown
      Platform: unknown
      fetch: typeof fetch
      applicationId: string
      origin?: string
      env?: 'PROD' | 'STAG'
      debug?: boolean
      locale?: string
      getRandomValues?: (length: number) => number[]
      getHmac?: (message: string, secret: string, algorithm?: string) => Promise<string>
    }): SmartUserRN

    static resetInstance(): void

    setup(
      applicationSecret: string,
      options?: {
        applicationIdOverride?: string
        distributionGroup?: string
        country?: string
        env?: 'PROD' | 'STAG'
        origin?: string
      },
      operationId?: string,
      externalAutologin?: string
    ): Promise<void>

    contextualize(forceConfigCountry?: boolean, operationId?: string, externalAutologin?: string): Promise<void>
    getUserToken(): string | null
    getAbsoluteReference(): string | null
    getObfuscatedReference(): Promise<string>
    isUserLogged(): boolean
    loginWithEmail(email: string, secret: string): Promise<void>
    signupWithEmail(email: string, secret: string): Promise<void>
    loginWithMSISDN(msisdn: string, secret: string): Promise<void>
    signupWithMSISDN(msisdn: string, secret: string, suggestedCountry?: string): Promise<void>
    logout(): Promise<void>
    handleLoginReturn(bet: string): Promise<void>
    getEnv(): 'PROD' | 'STAG'
    getContextBearer(): string | undefined
    refreshContextBearer(): Promise<void>

    forgotPasswordEmail(email: string): Promise<void>
    forgotPasswordMsisdn(msisdn: string, suggestedCountry?: string): Promise<void>
    resetPassword(secret: string, resetToken: string): Promise<void>
    updatePassword(identityId: string, userToken: string, secret: string, oldSecret?: string): Promise<void>
    updateAllPassword(userToken: string, secret: string): Promise<void>
    addIdentity(type: string, identifier: string, userToken: string, secret?: string): Promise<void>
    otpGenerateEmail(email: string, message?: string): Promise<void>
    otpGenerateMsisdn(msisdn: string, message?: string, suggestedCountry?: string): Promise<void>

    deleteUser(): Promise<void>
    isUserPayingFor(showFullOffer?: boolean): Promise<unknown>
    abortRecurrentPayment(): Promise<{ isUnsubscribed: boolean; paymentState: string; shouldLogout?: boolean; redirectUri?: string }>

    getCreditDetail(options?: { type?: string; showHistory?: boolean }): Promise<{ credit: { type: string; value: number; decimal: number }; creditLog: unknown[] | null }>

    createPlaylist(name: string): Promise<{ id: string; userId: string; name: string; isWishlist: boolean }>
    listPlaylists(): Promise<Array<{ id: string; userId: string; name: string; isWishlist: boolean }>>
    getWishlist(): Promise<Array<{ id: string; playlistId: string; userId: string; order: number; contentId: string; options: unknown }>>
    addWishlistItem(contentId: string, order?: number, options?: unknown): Promise<unknown>
    getPlaylist(playlistId: string): Promise<unknown[]>
    renamePlaylist(playlistId: string, name: string): Promise<void>
    deletePlaylist(playlistId: string): Promise<void>
    addPlaylistItem(playlistId: string, contentId: string, order?: number, options?: unknown): Promise<unknown>
    deletePlaylistItem(playlistId: string, itemId: string): Promise<void>
    reorderPlaylistItems(playlistId: string, itemIds: string[]): Promise<void>
    reorderPlaylistItem(playlistId: string, itemId: string, order: number): Promise<void>

    buyLicence(params: { orderType: string; contentRef: string; campaignId: string; countryCode: string; languageCode: string; transactionId?: string; isPremium?: boolean }): Promise<unknown>
    listValidLicences(campaignId: string): Promise<unknown[]>
    getLicence(contentRef: string): Promise<unknown>
    consumeLicence(params: { tokenUrl: string; website: string; id: string; method: string; idm: string; galaxyRef: string; countryCode: string }): Promise<{ endDate: string; drm: unknown; deliveryUserReference: string }>
    getDrm(params: unknown): Promise<{ endDate: string; drm: unknown; deliveryUserReference: string }>
    activateLicences(licencesIds: string[]): Promise<{ licences: unknown[]; errors: unknown[] }>

    on(event: string, listener: (...args: unknown[]) => void): void
    onOnce(event: string, listener: (...args: unknown[]) => void): void
    removeListener(event: string, listener: (...args: unknown[]) => void): void
    reset(): void
    setSnowPlow(getInstance: unknown, version: unknown): void
  }

  export class SDKError extends Error {
    code: string
    extra: Record<string, unknown>
    statusCode: number
    cause?: Error
  }

  export const TOKEN_PATTERNS: {
    ANONYMOUS_TOKEN: RegExp
    AUTOLOGIN_TOKEN: RegExp
    CUSTOM_TOKEN: RegExp
    EXTERNAL_TOKEN: RegExp
    SESSION_TOKEN: RegExp
  }

  export const STORAGE_KEYS: {
    AUTOLOGIN_TOKEN: string
    CUSTOM_TOKEN: string
    DEVICE: string
    NE_ENRICHMENT: string
    OAUTH_LOGIN_DATA: string
    OAUTH_LOGIN_PROVIDER: string
    QUEUED_EVENTS: string
    SESSION: string
    SESSION_TOKEN: string
    CONTEXT_BEARER: string
    ATOM_PRODUCT: string
  }
}

declare module '@digitalvirgo/su-bolt-react/web-adapter' {
  interface AsyncStorageAdapter {
    getAllKeys(): Promise<string[]>
    multiGet(keys: string[]): Promise<[string, string | null][]>
    multiSet(pairs: [string, string][]): Promise<void>
    multiRemove(keys: string[]): Promise<void>
  }

  export function createWebStorage(prefix?: string, storage?: Storage): AsyncStorageAdapter
  export function createWebSmartUserAsyncStorage(): AsyncStorageAdapter
  export function getWebPlatformConfig(): {
    Dimensions: { get(name: string): { width: number; height: number } }
    Platform: { OS: string }
  }
}
