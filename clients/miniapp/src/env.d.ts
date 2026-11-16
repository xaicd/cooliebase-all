/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue"
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_SLUG?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_BASE_PATH?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface WxLoginSuccessResult {
  code: string
  errMsg?: string
}

interface UniRequestOptions {
  url: string
  method?: "GET" | "POST" | "PUT" | "DELETE"
  data?: unknown
  header?: Record<string, string>
  timeout?: number
  success?: (res: { statusCode: number; data: unknown; header?: Record<string, string> }) => void
  fail?: (err: { errMsg?: string }) => void
}

declare const wx:
  | {
      login: (opts: {
        success?: (res: WxLoginSuccessResult) => void
        fail?: (err: { errMsg?: string }) => void
      }) => void
    }
  | undefined

declare const uni:
  | {
      request: (opts: UniRequestOptions) => void
      getStorageSync: (key: string) => string
      setStorageSync: (key: string, value: string) => void
      removeStorageSync: (key: string) => void
      switchTab?: (opts: { url: string }) => void
      navigateTo?: (opts: { url: string }) => void
    }
  | undefined
