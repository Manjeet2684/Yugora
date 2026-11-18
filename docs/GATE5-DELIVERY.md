# YUGORA — Gate 5 Browser QA and Release Review

**PostgreSQL CI:** Passed in [GitHub Actions run 44372085961](https://github.com/Manjeet2684/Yugora/actions/runs/44372085961), commit `58ca3787ee05865da6bc78f78fc2ef7030bc7feb`. The run used committed `package-lock.json` with `npm ci` and PostgreSQL 16. It passed 57 tests: 14 architecture, 11 persistence, 9 HTTP, 5 UI gesture, 2 copyright, and 16 Chromium browser tests, plus dependency audit and production build.

## Browser test approach

Playwright Test 1.65.1 drives Chromium against the built Next.js production server. Most UI journeys use page-level API interception for deterministic response/failure coverage. One unmocked browser journey uses the same pre-seeded PostgreSQL database as the deployed Next.js process, exercises the actual GET /feed → POST /swipe → GET /matches flow, reloads the page, and verifies that the profile is excluded and the mutual match persists. This complements the independent real-PostgreSQL HTTP and persistence suites.

## Browser scenarios

- An unmocked full-stack browser journey creates a mutual match for the seeded Riya profile, reloads, verifies it disappears from the feed, and retrieves the persisted match.
- Discover renders one profile card with labelled Like and Pass controls.
- Home remains blank; navigation switches back to Discover.
- Pass and one-sided Like submit their correct profile/direction payloads.
- Mutual Like opens the dialog only when the server returns a Match DTO; the Matches page renders that match.
- Match dialog receives focus, traps keyboard focus, closes with Escape, and restores prior focus when it remains available.
- Keyboard arrow keys and native Chromium touchscreen pointer events on a mobile-emulated device submit the same swipe shape as action buttons.
- Deterministic fixture-backed reload behaviour is covered separately from the unmocked PostgreSQL-backed persistence journey.
- Empty feed, broken image, feed error, swipe error and Matches error have independent retry/fallback tests.
- Mobile navigation is visible, the desktop sidebar is hidden, the card remains in viewport and the page has no horizontal overflow at 390px.
- Reduced-motion preference is respected and visible buttons have accessible names.
- Production responses include baseline security headers and no permissive Access-Control-Allow-Origin header.

## Concurrency and privacy regression

The HTTP integration suite sends two identical LIKE requests concurrently for a profile with a seeded incoming LIKE. Both responses resolve to the same canonical Match ID, while PostgreSQL contains one directed Swipe row and one canonical Match row for that pair. A separate persistence test concurrently submits opposite-direction LIKE decisions and verifies the transaction-scoped advisory lock creates exactly one mutual Match. Both concurrency tests passed in the PostgreSQL 16 CI run. Existing privacy assertions verify incoming one-sided interest is absent from feed and matches DTOs.

## Security boundary review

The Next.js app now adds Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy and DNS-prefetch controls. CSP still permits inline Next.js runtime scripts/styles and the current fictional profile image host; it is a baseline, not a strict nonce-based policy. HSTS is intentionally omitted until HTTPS hosting is configured.

The browser client uses relative same-origin API paths and the application does not grant cross-origin access with CORS headers. The API enforces JSON request content-type and strict input validation. This is appropriate for the assignment's single-demo-user setup, not a per-person access model.

## Not a production launch approval

- The environment's `DEMO_USER_ID` is shared by the demo; individual authentication and authorization are not implemented because the assignment explicitly excludes external authentication.
- Persistent distributed rate limiting, abuse prevention and operational monitoring are not implemented.
- Hosting provider, domain, HTTPS, production environment variables/secrets and deployment rollback policy are not configured.
- A stricter nonce/hash CSP should be introduced when deployment-specific Next.js configuration is selected.
- Manual screen-reader testing and real iOS/Android touch-device QA remain outstanding.

A green Playwright and CI run validates the committed demo implementation. It does not imply that a public production instance exists or is ready for real users.
