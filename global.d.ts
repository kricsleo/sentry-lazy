interface Window {
  _re: OnErrorEventHandlerNonNull
  _pe: OnErrorEventHandlerNonNull
  _ru: typeof window.onunhandledrejection
  _pu: typeof window.onunhandledrejection
  // @ts-ignore
  sentryLazy: typeof import('./dist/index')['default']
}