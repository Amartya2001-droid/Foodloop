# FoodLoop

A community food exchange built with React, TypeScript, Vite, Express and Drizzle. People can create an account, post surplus food, reserve a pickup, record measurements and confirm a handoff. The app starts empty: every displayed donation, organization, observation and pickup comes from application state.

**Live status: not live yet — blocked by Amartya's deployment configuration and production persistence decisions.** No working public deployment has been verified. The old `foodloop.replit.app` address is not an established live URL. A hosted database is not required to run the complete local workflow.

## Run locally

Use Node 22 and npm:

```sh
npm ci
npm run check
npm run build
npm test
STORAGE_MODE=memory npm run dev
# Or, after building:
STORAGE_MODE=memory npm start
```

Open http://localhost:5000 (`PORT` overrides it). No key, seeded account or hosted database is required. Register two accounts in separate browser profiles: one donor and one recipient. Passwords need 12–128 characters. Memory mode keeps accounts/listings/readings/reservations in one process and resets them on restart. Uploaded listing photos use the local `uploads/` directory and are not a persistent production asset store.

Try the flow:

1. Create an optional organization profile, then post food with its address and coordinates. Weight and pickup/expiry times are optional; provided dates and values are validated.
2. Open the listing's details to record actual temperature/humidity and a quality observation.
3. As another account, reserve a future pickup time and provide private contact details and notes.
4. In **Pickups**, the recipient marks food picked up; the donor confirms completion.
5. **Impact** now shows the confirmed pickup and its donor-reported weight. **Organizations** and supplier summaries show recorded donation activity.

## What works and where data comes from

| Flow | Source and honest limits |
| --- | --- |
| Accounts | Salted scrypt password hashes; random opaque sessions stored as hashes; HttpOnly SameSite=Strict cookies; 12-hour expiry, login throttling and cross-origin browser mutation rejection. No recovery/email verification or multi-instance session store. Sessions reset on restart in every storage mode. |
| Authorization | Ownership comes from the session, not form input. Only donors can mutate their food or submit readings/quality reports. Reservation details are restricted to donor/recipient. Organizations are owned by their creator and cannot self-verify. Shared memberships and independent verification are not implemented. |
| Reservations | Atomic availability check and claim creation; future pickup within the donor's window and before expiry; cancellation before pickup; recipient pickup then donor confirmation. Generic PATCH cannot change lifecycle status. Reservation history cannot be deleted. |
| Expiry | Reserved food is released two hours after arranged pickup, or at food expiry if earlier. Expiry reconciles on API requests, not a background scheduler. Expired food is excluded from available listings. |
| Sensors | Actual donor-submitted temperature (°C) and humidity (%) with server timestamps. Empty, failed and stale (>15 minutes) states are shown. Hardware/device ingestion is **not yet wired**; no simulated live readings. |
| Quality | Owner-entered observations with provenance/time, or an optional validated AI visual observation. No fabricated scores, confidence, shelf life, certification or default “85% fresh” display. An observation is not food-safety certification. |
| Impact | Confirmed pickup count, active reservations, donors with completed pickups and donor-reported listing weight for completed pickups. Weight coverage is shown; meals and CO₂ are **not measured** and are not estimated. Seven-day counts use UTC dates. |
| Suppliers | Actual posted/available donation counts and confirmed pickups. No staged AI scoring, seeded ratings, Google reviews or certification claims. Old supplier rating rows are not used as verified evidence. |
| Organizations | User-created contact/location profiles and owner-associated donation activity. Every profile is labeled community-submitted and not independently verified. |
| Locations | User-entered coordinates link to OpenStreetMap. The old marker grid is removed; an embedded geographic map is **not yet wired**. `/map` remains a compatible alias to food browsing. |

Legacy fabricated displays/examples were removed from active product code. `server/seed.ts` refuses automatic seeding rather than deleting data and inserting demo passwords/metrics. Isolated test fixtures remain clearly synthetic. The optional AI chat endpoint remains implemented; the main UI focuses on the donation workflow.

## Storage and services

Features call `IStorage` in `server/storage.ts`. `STORAGE_MODE=memory` selects ephemeral maps. Omitting it, or choosing `database`, uses the existing PostgreSQL adapter and requires a real **`DATABASE_URL`**. Unknown modes fail rather than silently falling back. The current Neon driver uses WebSocket transport; an ordinary local PostgreSQL URL is not a supported substitute by itself.

The PostgreSQL adapter implements the same workflows with transactions/row locks and an active-reservation unique index. Drizzle declares added reservation, organization ownership and listing-weight fields. Review `migrations/0001_reservation_workflow.sql` and `0002_real_data_flows.sql` for an existing database, or review a schema push against an approved fresh database. Do not run both blindly. **No hosted database was provisioned, connected or migrated, and database runtime parity remains unverified.** Provisioning and deployment are Amartya's decisions.

Exact configuration needs:

- `DATABASE_URL`: required only for approved database-backed operation; not needed locally in memory mode.
- `OPENAI_API_KEY`: optional, required only for real external AI photo inspection/chat. Without it photo inspection returns 503 and manual observations remain usable. No successful external call has been claimed.
- `OPENAI_BASE_URL`: optional server-controlled endpoint override for a compatible provider or local test stub; omit for OpenAI. Never accepted from browser input.
- `COOKIE_SECURE=true`: deployment setting for HTTPS cookies; configure a same-origin HTTPS proxy. No session signing secret is needed for opaque server-held sessions.
- `PORT`: optional; defaults to 5000.

No keys belong in source, issue comments or PR bodies. The runtime does not automatically load `.env` files.

## Tests

`npm run check`, `npm run build` and `npm test` cover the API in development/production memory mode, account/ownership controls, reservation races/transitions/expiry, organization association, sensor validation/provenance, manual observations and confirmed impact. AI integration is tested against a loopback stub with a generated ephemeral test token, including invalid-provider-output rejection; it never uses a real key/service.

The Playwright test uses two isolated browser accounts to post food, record measurements/observations, reserve, collect and confirm, inspect impact and check mobile overflow:

```sh
npx playwright install chromium
npm run test:browser
# If a system Chromium is already installed:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

CI on Node 22 runs type checking, build, API tests and Chromium browser coverage. Build warnings for outdated Browserslist data and PostCSS remain. Coverage is not exhaustive: explicit session-expiry integration coverage, generalized organization memberships, production session persistence, database runtime tests, independent food verification, hardware telemetry and deployment hardening remain follow-ups.

## Licence and program log

[MIT LICENSE](LICENSE) matches the package declaration. No contradictory tracked-text licence notice was found in Day 2; third-party licences and binary asset provenance were not audited. Historical [DB-VERIFICATION.md](DB-VERIFICATION.md), `INSTRUCTIONS.md` and `replit.md` describe older snapshots or aspirations, not current feature guarantees. This README is the current status.

See [AGENTS.md](AGENTS.md) for branch, PR, test and reporting rules. Daily reports: [issue #1](https://github.com/Amartya2001-droid/Foodloop/issues/1).
