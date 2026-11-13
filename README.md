# FoodLoop AI

Food redistribution hackathon prototype built with React, Vite, Express, TypeScript and Drizzle. Day 1 audit for the Nov 11, 2026 brief, performed Nov 10, 2026. This repository contains application code, not just a proposal.

**Live status: not live yet — blocked by deployment configuration, a provisioned database, and production security work.** No working public deployment has been verified. The previous README's `https://foodloop.replit.app` was labelled a demo and is not an established live URL.

## Reservations and pickup (feature PR)

Signed-in recipients reserve available food with an arranged pickup time, private contact details and notes. The donor cannot reserve their own listing. A reservation expires two hours after the arranged pickup (or at food expiry, if earlier). Expiry is reconciled on API requests; it releases still-edible food and retains history. Either participant can cancel before pickup. The recipient marks pickup, then the donor confirms completion. Invalid transitions and concurrent reservations return conflicts. The monitor page shows both sides' reservation activity and donor listings, with actions based on identity.

Lifecycle status cannot be changed through the generic PATCH endpoint. Listings with reservation history cannot be deleted. Memory operations run atomically within one process; the PostgreSQL adapter uses transactions and row locks, with a partial unique index as a second guard. The added claim columns/index are declared in Drizzle and in `migrations/0001_reservation_workflow.sql` for review against an existing database. Do not run both manual SQL and schema push blindly. No real database has been connected or migrated; `DATABASE_URL` is needed for that later validation. Local memory mode needs no schema setup or secrets.

Tests cover simultaneous claims, privacy, actor permissions, cancellation/re-reservation, expiry, invalid transitions, and one-time confirmed completion. This supersedes the historical reservation gaps below. PRs are stacked: reservation depends on authentication.

## Working authentication (feature PR)

Registration, login, current-account lookup and logout now work in local memory mode. Passwords use salted scrypt hashes; opaque random session tokens are stored as hashes in a bounded, expiring server-side session map and delivered in HttpOnly, SameSite=Strict cookies. Sessions last 12 hours and reset on server restart, including in database mode. Credentials require 12–128 characters. There is no email verification, password recovery or multi-instance session persistence yet.

Create an account using the account bar. Posting derives donor ownership from the session. Only the donor can edit/delete their listings or submit sensor readings; `/api/my-listings` uses the signed-in donor. Anonymous users may browse. AI endpoints require sign-in. Cross-origin browser mutations are rejected and sign-in attempts are rate limited per process. Account data and session tokens are excluded from response logs. For HTTPS hosting set `COOKIE_SECURE=true`; no secret is required for local opaque sessions. Run behind a same-origin HTTPS proxy before exposing externally.

The sections below describing missing auth are the historical Day 1 audit; this section supersedes those auth findings. Reservation and display gaps remain until their separate feature PRs. DB-VERIFICATION.md records the pre-feature Day 2 snapshot.

## Run locally

Use Node.js 22 and npm. No credentials are needed for the explicitly selected, empty in-memory mode:

```sh
npm ci
npm run check
npm run build
npm test
STORAGE_MODE=memory npm run dev
# Or run the built app:
STORAGE_MODE=memory npm start
```

Open http://localhost:5000 (override with `PORT`). Memory mode reuses the existing MemStorage implementation; data disappears on restart and no organizations or demo accounts are seeded. It is for local checks only. Omitting `STORAGE_MODE` retains database storage and requires `DATABASE_URL`; there is no silent fallback. Unknown storage modes fail at startup.

For database-backed operation, provision a compatible Neon PostgreSQL database and supply its real `DATABASE_URL` through your environment, then run `npm run db:push`. The driver uses Neon's WebSocket transport; an ordinary local PostgreSQL URL alone is insufficient. No database was provisioned or connected during this audit. `server/seed.ts` is a destructive demo reset script with fabricated organization/rating data and plaintext demo passwords; do not use it on production data. The runtime does not automatically load `.env` files. Do not commit secrets.

`OPENAI_API_KEY` is optional for startup; without it the chat and image-detection endpoints return 503. Successful external AI calls have not been verified. No session secret is currently consumed by authentication middleware.

## What exists and what was verified

- Production bundle builds and TypeScript checks pass after fixing nullable pickup dates on the homepage.
- Smoke tests start both development and built production servers without credentials, serve the app shell, and exercise in-memory listing creation, status update, deletion and unavailable-AI handling.
- Listing APIs support browsing, multipart creation with optional images, status updates and deletion. Organization/detail and sensor read/write routes have storage implementations. Database-backed behavior remains unverified here.
- React pages exist for home, map, impact, monitoring, organizations and organization details. Serving the HTML shell is tested; full browser interactions are not covered by the smoke suite.
- CI runs clean installation, type checking, build and smoke tests on pull requests and pushes to main. This is initial smoke coverage, not comprehensive coverage.

## Stubbed or misleading in the prototype

- MapView draws a grid of markers, not a geographical map; coordinates and center do not position markers. Some locations are hardcoded.
- Sensor and quality displays include mock readings/results. Impact figures are hardcoded or derived using arbitrary listing-count multipliers, not measured outcomes.
- Supplier analysis displays stored demo ratings with staged animation; there is no Google reviews/certification verification pipeline.
- The claim button changes listing status only. Claims storage exists, but there is no claim-creation API, identity-bound reservation or pickup workflow.
- Posting uses a hardcoded `demo-user`; monitoring uses `hope_food_bank`. There are no implemented login, registration, logout or session routes despite earlier documentation.
- UI badges such as verified, AI certified and carbon neutral are prototype copy, not established certifications or metrics. Historical INSTRUCTIONS.md and replit.md also describe aspirational behavior; this README takes precedence for verified status.

## Missing for a working redistribution product

Authenticated users, password hashing and authorization; validated claim/reservation transitions and concurrent-claim protection; identity-bound donor ownership; verified partner onboarding; pickup coordination/completion; trustworthy impact measurement; real mapping and sensor integration; production database/schema management, persistent uploads, monitoring and deployment. Current unauthenticated mutation endpoints must not be exposed as a production service. Food-image model output is not food-safety certification. Chat has a process-local rate limiter; image detection does not share that protection.

No open issues or PRs existed at the initial audit. Day 1 changes are limited to repository rules, CI, smoke coverage, local startup and the existing type-check blocker. Further product work belongs to later days.

## Repository and reporting

See [AGENTS.md](AGENTS.md) for mandatory branch, PR, testing and daily reporting rules. Reports: [10-day agent program — daily log](https://github.com/Amartya2001-droid/Foodloop/issues/1).

The declared package licence is MIT; see [LICENSE](LICENSE). A Day 2 search of tracked text found no contradictory licence header or notice. This is not an audit of third-party dependencies or image provenance. See [DB-VERIFICATION.md](DB-VERIFICATION.md) for the memory-only schema and workflow verification, limitations, and follow-up triage.
