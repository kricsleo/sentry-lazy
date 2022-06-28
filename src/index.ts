type Sentry = typeof import('@sentry/browser')
type InitOptions = Parameters<Sentry['init']>[0]

type SentryLazy = {
  init: (Sentry: Sentry, options: InitOptions) => void
} & {
  [k in typeof proxyedSentryFns[number]]: (...args: any) => unknown
}

const w = window

const sentryQueue: Array<(sentry: Sentry) => void> = []
const errorQueue: Array<Parameters<OnErrorEventHandlerNonNull>> = []
const rejectionQueue: Array<PromiseRejectionEvent> = []

const proxyedSentryFns = [
  'addBreadcrumb',
  'captureException',
  'captureEvent',
  'captureMessage',
  'configureScope',
  'createTransport',
  'startTransaction',
  'setContext',
  'setExtra',
  'setExtras',
  'setTag',
  'setTags',
  'setUser',
  'withScope',
] as const

let sentryLazy: SentryLazy = proxyedSentryFns.reduce((all, cur) => {
  all[cur] = createSentryProxy(cur)
  return all
}, { init } as SentryLazy)

function init(Sentry: Sentry, options: InitOptions) {
  Sentry.init(options)
  restoreWindowFns()
  replayFns()
  sentryLazy = {
    ...Sentry,
    init
  }
}

function proxyWindowFns() {
  // already proxyed
  if(w._pe && w._pe === w.onerror) {
    return
  }
  w._re = w.onerror
  w._ru = w.onunhandledrejection
  w._pe = w.onerror = (...args) =>
    errorQueue.push(args) && w._re?.(...args);
  w._pu = w.onunhandledrejection = (e: PromiseRejectionEvent) =>
    rejectionQueue.push(e) && w._ru?.(e)
}

function restoreWindowFns() {
  w._pe === w.onerror && (w.onerror = w._re)
  w._pu === w.onunhandledrejection
    && (w.onunhandledrejection = w._ru)
}

function replayFns() {
  errorQueue.forEach(args => w.onerror?.(...args))
  rejectionQueue.forEach(e => w.onunhandledrejection?.(e))
  sentryQueue.length = errorQueue.length = rejectionQueue.length = 0
}

function createSentryProxy(name: string) {
  return (...args) => sentryQueue.push(t => t[name](...args))
}

proxyWindowFns()

export default sentryLazy
