type Sentry = typeof import('@sentry/browser')
type InitOptions = Parameters<Sentry['init']>[0]

type SentryLazy = {
  init: (Sentry: Sentry, options: InitOptions) => void
} & {
  [k in typeof proxyedSentryFns[number]]: (...args: any) => unknown
}

const w = window

let sequence = 0
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

const sentryLazy: SentryLazy = proxyedSentryFns.reduce((all, cur) => {
  all[cur] = createSentryProxy(cur)
  return all
}, { init } as SentryLazy)

export function init(Sentry: Sentry, options: InitOptions) {
  Sentry.init(options)
  restoreWindowFns()
  replayFns(Sentry)
  w.sentryLazy = Sentry
}

function proxyWindowFns() {
  // already proxyed
  if(w._pe && w._pe === w.onerror) {
    return
  }
  w._re = w.onerror
  w._ru = w.onunhandledrejection
  w._pe = w.onerror = (...args) =>
    (errorQueue[sequence++] = args) && w._re?.(...args);
  w._pu = w.onunhandledrejection = (e: PromiseRejectionEvent) =>
    (rejectionQueue[sequence++] = e) && w._ru?.(e)
}

function restoreWindowFns() {
  w._pe === w.onerror && (w.onerror = w._re)
  w._pu === w.onunhandledrejection
    && (w.onunhandledrejection = w._ru)
}

function replayFns(Sentry: Sentry) {
  for(let i = 0, length = Math.max(errorQueue.length, rejectionQueue.length, sentryQueue.length); i < length; i++) {
    if(errorQueue[i]) {
      w.onerror?.(...errorQueue[i])
    } else if(rejectionQueue[i]) {
      w.onunhandledrejection?.(rejectionQueue[i])
    } else if(sentryQueue[i]) {
      sentryQueue[i](Sentry)
    }
  }
  sentryQueue.length = errorQueue.length = rejectionQueue.length = 0
}

function createSentryProxy(name: string) {
  return (...args) => sentryQueue[sequence++] = t => t[name](...args)
}

proxyWindowFns()

w.sentryLazy = sentryLazy
