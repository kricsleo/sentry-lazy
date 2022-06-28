type Sentry = typeof import('@sentry/browser')
type InitOptions = Parameters<Sentry['init']>[0] & {
  [key: string]: any
}

type SentryLazy = {
  init: (Sentry: Sentry, options: InitOptions) => void
} & {
  [k in typeof proxyedSentryFns[number]]: (...args: any) => unknown
}

// short name to save bytes
const w = window
const error = 'onerror'
const rawError = '_re'
const proxyedError = '_pe'
const rejection = 'onunhandledrejection'
const rawRejection = '_rr'
const proxyedRejection = '_pr'

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
  if(!w[proxyedError] || w[proxyedError] !== w[error]) {
    w[rawError] = w[error]
    w[proxyedError] = w[error] = (...args) =>
      (errorQueue[sequence++] = args) && w[rawError] && w[rawError](...args);
  }
  if(!w[proxyedRejection] || w[proxyedRejection] !== w[rejection]) {
    w[rawRejection] = w[rejection]
    w[proxyedRejection] = w[rejection] = (e: PromiseRejectionEvent) =>
      (rejectionQueue[sequence++] = e) && w[rawRejection] && w[rawRejection](e)
  }
}

function restoreWindowFns() {
  w[proxyedError] === w[error] && (w[error] = w[rawError])
  w[proxyedRejection] === w[rejection] && (w[rejection] = w[rawRejection]);
  [rawError, proxyedError, rawRejection, proxyedRejection].forEach(name => delete w[name])
}

function replayFns(Sentry: Sentry) {
  for(let i = 0; i < sequence; i++) {
    // ignore error when replaying, make sure all error are replayed
    try {
      if(errorQueue[i]) {
        w[error] && w[error](...errorQueue[i])
      } else if(rejectionQueue[i]) {
        w[rejection] && w[rejection](rejectionQueue[i])
      } else if(sentryQueue[i]) {
        sentryQueue[i](Sentry)
      }
    } catch {}
  }
  sequence = sentryQueue.length = errorQueue.length = rejectionQueue.length = 0
}

function createSentryProxy(name: string) {
  return (...args) => sentryQueue[sequence++] = t => t[name](...args)
}

proxyWindowFns()

w.sentryLazy = sentryLazy
