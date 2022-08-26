import type * as SentryBrowser from '@sentry/browser'
import type { BrowserOptions } from '@sentry/browser'

type Sentry = typeof SentryBrowser

interface QueueItem {
  /** handler name in window */
  w?: string
  /** handler name in Sentry */
  s?: string
  /** arguments */
  a: IArguments
}

// use variables and short names to save bytes after compiled
const w = window
const namespace = 'SentryLazy'
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

/** proxy these functions on Sentry */
const proxyedSentryFns = 'addBreadcrumb captureException captureEvent captureMessage configureScope withScope setContext setExtra setTag setUser'.split(' ')

const sentryLazy = proxyedSentryFns.reduce(function (all, cur) {
  all[cur] = createSentryProxy(cur)
  return all
}, { init, loadScript })

function init(Sentry: Sentry, options: BrowserOptions) {
  restoreWindowFns()
  w[namespace] = Sentry
  Sentry.init(options)
  replayFns(Sentry)
}

function proxyWindowFns() {
  handlerQueue.forEach(function ([handler, rawHandler, proxyedHandler]) {
    // avoid dulplicate proxy
    if(!w[proxyedHandler] || w[proxyedHandler] !== w[handler]) {
      w[rawHandler] = w[handler]
      w[proxyedHandler] = w[handler] = function () {
        // if no proxy handler, don't push queue
        w[proxyedHandler] && queue.push({w: handler, a: arguments})
        return w[rawHandler] ? w[rawHandler].apply(w, arguments) : true;
      }
    }
  })
}

function restoreWindowFns() {
  handlerQueue.forEach(function ([handler, rawHandler, proxyedHandler]) {
    // only restore handler if nobody else changed it,
    // if someone else also proxyed the handler, then don't restore it to make sure
    // we don't break things
    if(w[proxyedHandler] === w[handler]) {
      w[handler] = w[rawHandler]
      delete w[rawHandler]
    }
    // delete proxy handler as a flag of restore
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
  return function (): any {
    queue.push({s: fnName, a: arguments})
  }
}

function loadScript(src: string, cb: (success: boolean) => void) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.crossOrigin = 'anonymous'
  script.async = true;
  script.onload = () => cb(true)
  script.onerror = () => cb(false)
  script.src = src
  document.head.appendChild(script);
}

proxyWindowFns()

w[namespace] = sentryLazy
