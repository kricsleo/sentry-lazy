interface Window {
  _re: OnErrorEventHandlerNonNull
  _pe: OnErrorEventHandlerNonNull
  _ru: typeof window.onunhandledrejection
  _pu: typeof window.onunhandledrejection
  sentryLazy: typeof import('./src/index')['default']
}