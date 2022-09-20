# Sentry-lazy

A tiny tool helps to lazy load Sentry without missing any error.

## Why it

In some performance-sensitive applications, you might not want to load Sentry at the beginning, for Sentry is a big bundle that could slow down the page.

When lazy load Sentry, it can help cache unhandled errors before Sentry loaded and replay cached errors for Sentry to report all of them.

## Usage

### Import Script

```html
<!-- put this line as the first script of your page -->
<script src="https://cdn.jsdelivr.net/npm/sentry-lazy/dist/sentry-lazy.global.js"></script>
```

It's better to put this tool as the first script of your page so that all unhandled errors which happen after will be cached. Don't worry about slowing down your page, because it's quite small, less than 1kb.

### Init Sentry

```typescript
// For example:
// import('@sentry/browser').then(Sentry => {
//   ...
// })
yourCustomSentryAsyncLoader().then(Sentry => {
  window.SentryLazy.init(Sentry, {
    dsn: '<your_dsn>'
    // ...
  })
})
```

It doesn't care or limit how you load Sentry, except by providing a `loadScript` function which you can use to load js.

It will also expose a global variable named `SentryLazy`, when Sentry is loaded, call `window.SentryLazy.init(Sentry, initOptions)` to init Sentry. That's all, it will replay all errors cached before.

## Call Sentry Functions Before Loaded

You call also call part of Sentry functions on `SentryLazy` before Sentry is loaded, because it proxied some of Sentry functions for convenience. It will also cache those calls and replay them after `SentryLazy.init()` is called.

Which functions are available on `SentryLazy`? See [proxyedSentryFns](./src/index.ts) for detail.
