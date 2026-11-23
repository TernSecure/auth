---
'@tern-secure/react': patch
---

fix: prevent `Maximum call stack size exceeded` when a listener added through `addListener` is unsubscribed before TernSecure has finished loading (for example during React Strict Mode's effect re-run on hydration in newer Next.js versions).
