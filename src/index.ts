type Sentry = typeof import('@sentry/browser')
type InitOptions = Parameters<Sentry['init']>[0] & {
  [key: string]: any
}

type SentryLazy = {
  init: (Sentry: Sentry, options: InitOptions) => void
} & {
  [k in typeof proxyedSentryFns[number]]: (...args: any) => unknown
}

interface QueueItem {
  /** handler name in window */
  w?: string
  /** handler name in Sentry */
  s?: string
  /** arguments */
  a: IArguments
}

// short name to save bytes
const w = window
const error = 'onerror'
const rawError = '_re'
const proxyedError = '_pe'
const rejection = 'onunhandledrejection'
const rawRejection = '_rr'
const proxyedRejection = '_pr'

const queue: QueueItem[] = []
const handlerQueue = [
  [error, rawError, proxyedError],
  [rejection, rawRejection, proxyedRejection],
] as const

const proxyedSentryFns = [
  'addBreadcrumb',
  'captureException',
  'captureEvent',
  'captureMessage',
  'configureScope',
  'withScope',
  'setContext',
  'setExtra',
  'setTag',
  'setUser',
  'showReportDialog'
] as const

const sentryLazy: SentryLazy = proxyedSentryFns.reduce(function (all, cur) {
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
  handlerQueue.forEach(function ([handler, rawHandler, proxyedHandler]) {
    if(!w[proxyedHandler] || w[proxyedHandler] !== w[handler]) {
      w[rawHandler] = w[handler]
      w[proxyedHandler] = w[handler] = function () {
        queue.push({w: handler, a: arguments})
        w[rawHandler] && w[rawHandler].apply(w, arguments);
      }
    }
  })
}

function restoreWindowFns() {
  handlerQueue.forEach(function ([handler, rawHandler, proxyedHandler]) {
    w[proxyedHandler] === w[handler] && (w[handler] = w[rawHandler])
    delete w[rawHandler]
    delete w[proxyedHandler]
  });
}

function replayFns(Sentry: Sentry) {
  while(queue.length) {
    // ignore errors when replaying, make sure all errors are replayed
    try {
      const { w: windowHandler, s: sentryHandler, a: args } = queue.shift()
      windowHandler && w[windowHandler] && w[windowHandler].apply(w, args)
      sentryHandler && Sentry[sentryHandler] && Sentry[sentryHandler].apply(Sentry, args)
    } catch {}
  }
}

function createSentryProxy(fnName: string) {
  return function () {
    queue.push({s: fnName, a: arguments})
  }
}

proxyWindowFns()

w.sentryLazy = sentryLazy
