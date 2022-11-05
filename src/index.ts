import type * as SentryBrowser from '@sentry/browser'
import type { BrowserOptions } from '@sentry/browser'

type Sentry = typeof SentryBrowser
type WindowError = 'error' | 'unhandledrejection'
interface QueueItem {
  w?: WindowError
  s?: string
  a: IArguments
}

const w = window
const namespace = 'SentryLazy'
const queue: QueueItem[] = []
const listeners: Record<WindowError, (this: Window) => any> = { error: null, unhandledrejection: null }
const sentryFns = 'addBreadcrumb captureException captureEvent captureMessage configureScope withScope setContext setExtra setTag setUser'.split(' ')

const sentryLazy = sentryFns.reduce(function (all, cur) {
  all[cur] = createSentryListener(cur)
  return all
}, { init, loadScript })

listenWindowErrors()
w[namespace] = sentryLazy

function createSentryListener(fnName: string) {
  return function () {
    queue.push({s: fnName, a: arguments})
  }
}

function listenWindowErrors() {
  Object.keys(listeners).forEach((eventName: WindowError) => {
    listeners[eventName] = function() {
      queue.push({ w: eventName, a: arguments })
    }
    w.addEventListener(eventName, listeners[eventName])
  })
}

function unlistenWindowErrors() {
  Object.keys(listeners).forEach(eventName => {
    w.removeEventListener(eventName, listeners[eventName])
  })
}

function replayQueue(Sentry: Sentry) {
  while(queue.length) {
    // ignore errors when replaying, make sure all errors are replayed
    try {
      const { w: windowHandler, s: sentryHandler, a: args } = queue.shift()
      windowHandler && w[windowHandler] && w[windowHandler].apply(w, args)
      sentryHandler && Sentry[sentryHandler] && Sentry[sentryHandler].apply(Sentry, args)
    } catch {}
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
  setTimeout(() => document.head.appendChild(script))
}

function init(Sentry: Sentry, options: BrowserOptions) {
  unlistenWindowErrors()
  w[namespace] = Sentry
  Sentry.init(options)
  replayQueue(Sentry)
}
