import { SentryLazy } from './src/index'

declare global {
  interface Window {
    sentryLazy: SentryLazy
  }
}
