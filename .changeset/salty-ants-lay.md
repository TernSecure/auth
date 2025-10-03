---
'@tern-secure/backend': patch
'@tern-secure/nextjs': patch
'@tern-secure/shared': patch
'@tern-secure/react': patch
'@tern-secure/types': patch
'@tern-secure/auth': patch
---

fix(auth): update response handling in getAuth to correctly access idToken and refreshToken

refactor(TokenApi): streamline exchangeCustomForIdAndRefreshTokens method by removing try-catch and simplifying request logic

style(TokenApi): standardize string quotes and remove unnecessary whitespace

chore(request): clean up code by removing extra line in createRequest function
