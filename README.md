# Sentry-lazy

A lazy loader for sentry.

## Usage

### Install

```bash
# npm i sentry-lazy
yarn add sentry-lazy
```

### Use

```typescript
import { sentryLazy } from 'sentry-lazy'

type Strategy = 'instant' | 'need'

// By default, it won't load Sentry until `an unhandled error`, .etc. happen
// @see https://docs.sentry.io/platforms/javascript/install/lazy-load-sentry/#load-timing
const sentry = sentryLazy({
  dsn: '<your_sentry_dsn>'
})
// const sentry = sentryLazy('<your_sentry_dsn>', {
//   // you custome the load timing, it means Sentry will be loaded instantly after this line.
//   strategy: 'instant'
// })

// If you want to know when is Sentry loaded, you can listen to `onLoad`
sentry.onLoad = () => console.log('Sentry fully loaded!')
```

## How it works?

Two parts:
  1. error cacher(common for all)
  2. Sentry loader(special for kinds of Sentry)

## Attentions

Lazy loading Sentry means the performance data and breadcrumbs data will be losing, since Sentry is loaded after the page has loaded. But the exception in your application which happened before Sentry is loaded won't be losing, it will be automaticly stored and sent using `Sentry.captureException` after that.
