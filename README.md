# Sentry-lazy

A tool for lazy load Sentry.

In some performance sensitive applications, you might not want to load Sentry at the beginning, for Sentry is a big bundle that could slow down the page.

If you want to lazy load Sentry after the page loaded, it can help cache unhandled errors before Sentry loaded and replay cached errors for Sentry to report all of them.

## Usage

### Recommended

It's better to use this tool as a script at the begining of your page, so that all unhandled errors happens after it will be cached. Don't worry about slow down your page, because it's quite small, less than 1kb

```html
<!-- put this line as the first script in your page -->
<script src="https://cdn.jsdelivr.net/npm/sentry-lazy"></script>
```

It will expose a global variable named `sentryLazy`, then **your shall load Sentry yourself**, when Sentry is fullyed loaded, call `window.sentryLazy.init(Sentry, initOptions)` to init your Sentry, that's all, it will replay all errors happened before.

```typescript
yourCustomSentryAsyncLoader().then(Sentry => {
  // sentryLazy is exposed to window by the script
  window.sentryLazy.init(Sentry, {
    dsn: '<your_dsn>'
    // ...
  })
})
```

You call also call some Sentry functions before Sentry is loaded, because the `sentryLazy` proxyed some of Sentry functions for convinence. It will cache those calls and replay them after `sentryLazy.init()` is called.

Which functions are avaliable on `sentryLazy`? See [proxyedSentryFns](./src/index.ts) for detail.

### TS Support

1. Install package

```bash
# npm i sentry-lazy
yarn add sentry-lazy
```

2. Add this config in your `tsconfig.json`

```json
{
  "compilerOptions": {
    "types": ["sentry-lazy/global"]
  }
}
```

## Attentions

Lazy loading Sentry means the performance data and breadcrumbs data will be losing, since Sentry is loaded after the page has loaded. But the exception in your application which happened before Sentry won't be losing, it will be automaticly stored and sent after that.