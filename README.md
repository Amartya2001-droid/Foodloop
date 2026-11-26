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
| Authorization | Ownership comes from the session, not form input. Only donors can mutate their food or submit readings/quality reports. Reservation details are restricted to donor/recipient. Organizations have owner-controlled invitations and member/manager roles; invitations require consent. Only configured independent reviewers can approve profile review. See the permission rules below. |
| Reservations | Atomic availability check and claim creation; future pickup within the donor's window and before expiry; cancellation before pickup; recipient pickup then donor confirmation. Generic PATCH cannot change lifecycle status. Reservation history cannot be deleted. |
| Expiry | Reserved food is released two hours after arranged pickup, or at food expiry if earlier. Expiry reconciles on API requests, not a background scheduler. Expired food is excluded from available listings. |
| Sensors | Actual donor-submitted temperature (°C) and humidity (%) with server timestamps. Empty, failed and stale (>15 minutes) states are shown. Hardware/device ingestion is **not yet wired**; no simulated live readings. |
| Quality | Owner-entered observations with provenance/time, or an optional validated AI visual observation. No fabricated scores, confidence, shelf life, certification or default “85% fresh” display. An observation is not food-safety certification. |
| Impact | Confirmed pickup count, active reservations, donors with completed pickups and donor-reported listing weight for completed pickups. Weight coverage is shown; meals and CO₂ are **not measured** and are not estimated. Seven-day counts use UTC dates. |
| Suppliers | Actual posted/available donation counts and confirmed pickups. No staged AI scoring, seeded ratings, Google reviews or certification claims. Old supplier rating rows are not used as verified evidence. |
| Organizations | User-created contact/location profiles and owner/member-associated donation activity. Unreviewed profiles are labeled as such; only an audited independent app review can show reviewed. This is not regulatory certification. |
| Locations | User-entered coordinates link to OpenStreetMap. The old marker grid is removed; an embedded geographic map is **not yet wired**. `/map` remains a compatible alias to food browsing. |

Legacy fabricated displays/examples were removed from active product code. `server/seed.ts` refuses automatic seeding rather than deleting data and inserting demo passwords/metrics. Isolated test fixtures remain clearly synthetic. The optional AI chat endpoint remains implemented; the main UI focuses on the donation workflow.

## Health probes and graceful shutdown

The HTTP server exposes two unauthenticated, non-cached operational endpoints, in both development and built production mode. They return only a status string, never configuration values, raw dependency errors or application records:

| Probe | Result |
| --- | --- |
| `GET /health/live` | 200 with `{"status":"alive"}` while the HTTP process can respond. This remains liveness, not storage readiness. |
| `GET /health/ready` | 200 with `{"status":"ready"}` only after initialization and a successful storage probe. Once listening, drain, failed storage or a one-second probe timeout returns 503 with `{"status":"not_ready"}`. |

Verify a local memory run with:

```sh
curl -i http://localhost:5000/health/live
curl -i http://localhost:5000/health/ready
```

Memory storage has no external dependency, so readiness means the in-process store and request-serving runtime have initialized. Database mode probes a read of at most one listing ID: it checks that connection/table path, not every table, migration, workflow or third-party service. **Database-mode probe behavior has not been verified against a real database.** Overlapping readiness requests share one storage operation. The one-second bound applies to the HTTP response; it does not cancel an already-running database query, and that operation stays shared until it settles rather than multiplying slow queries.

On SIGTERM or SIGINT the runtime first marks itself draining, then stops accepting new HTTP connections. Requests already executing may finish; any later request admitted on an existing connection receives 503 with `Connection: close`. Readiness cannot return to ready after drain starts. Once HTTP drains, the PostgreSQL pool (when selected) and development Vite resources close. Clean shutdown exits 0. The whole drain/resource-cleanup phase has a fixed **10-second deadline**; a failure or deadline exhaustion forcibly closes HTTP connections and exits 1. Configure a deployment host's termination grace period to exceed that deadline. No deployment settings have been applied here.

Development disables speculative HTML pre-transforms so actual request work can drain before optimizer teardown; on-demand transforms remain enabled. Development shutdown tolerates Vite's expected optimizer build-cancellation message only while draining; ordinary build failures and unexpected shutdown errors remain fatal. Listing/sensor validation failures return clean 400 responses without logging Zod stacks; unexpected storage failures return generic 500 responses. Regression tests exercise the actual Vite logger in both runtime phases, malformed listing JSON and invalid sensor/listing input before asserting a clean SIGTERM exit.

Probes do not make memory data durable or process-local sessions shared, verify external AI/hardware, certify food safety, or establish a live deployment. Shutdown/probe tests use local memory and controlled dependency/signal fixtures; they do not require a real `DATABASE_URL` or reviewer assignments.

## Organization permissions and review

- The creator is the fixed **owner**. Ownership cannot be changed through profile or membership forms. Only the owner invites existing accounts, changes member/manager roles, removes others or submits review evidence. An invite alone grants no access.
- Invitees accept or decline their own invitations. Active **members** and **managers** can associate their own donations with the organization. Members may leave; declined/removed memberships grant no rights. No organization role can edit another donor's food or read unrelated reservation contacts.
- **Managers** may edit profile fields and see membership/review information. They cannot manage other members, request verification or grant themselves roles. Profile changes invalidate previous verification and supersede pending review requests.
- Organization evidence and review notes are private to owner/managers and authorized independent reviewers. Public profiles show only reviewed/unreviewed/pending status and review time, without private evidence.
- **Reviewers** are existing accounts explicitly configured by immutable ID in `ORGANIZATION_REVIEWER_IDS`. Public registration never grants this role. Owners and anyone with membership history in the organization cannot review it, even after leaving. Configured reviewers cannot be invited into organizations. Decisions require a rationale and persist reviewer, timestamp and status; duplicate decisions conflict. Rejection permits resubmission.
- No reviewer is configured automatically. Startup rejects nonexistent configured account references; fresh memory runs must leave the list unset. The UI shows that approval is not yet available and permits honest pending requests. An approved app profile review is not food-safety certification, independent accreditation or a claim that an external API validated evidence. Legacy `verified` flags without an audited approval are displayed as unverified.

Memory mutations are atomic in one process. PostgreSQL membership/verification operations serialize on an organization row lock, including the membership check when creating an associated donation. Reviewer assignment and hosted database setup remain Amartya's decisions. See [AUTHORIZATION.md](AUTHORIZATION.md) for the issue #3 criterion/evidence matrix and merge-gated completion rule.

## Storage and services

Features call `IStorage` in `server/storage.ts`. `STORAGE_MODE=memory` selects ephemeral maps. Omitting it, or choosing `database`, uses the existing PostgreSQL adapter and requires a real **`DATABASE_URL`**. Unknown modes fail rather than silently falling back. The current Neon driver uses WebSocket transport; an ordinary local PostgreSQL URL is not a supported substitute by itself.

The PostgreSQL adapter implements the same workflows with transactions/row locks and an active-reservation unique index. Drizzle declares added reservation, organization ownership and listing-weight fields. Review `migrations/0001_reservation_workflow.sql` and `0002_real_data_flows.sql` and `0003_organization_permissions.sql` for an existing database, or review a schema push against an approved fresh database. Do not run both blindly. **No hosted database was provisioned, connected or migrated, and database runtime parity remains unverified.** Provisioning and deployment are Amartya's decisions.

## Startup and deployment contract

`server/index.ts` validates configuration before runtime/storage initialization. Invalid settings exit **1**, name the offending environment variables and never echo their values. Then one **5-second budget** covers the storage probe and all configured reviewer-account lookups, before any HTTP listener opens. A failed/timed-out check exits 1; syntax validation alone is not proof that credentials or a database work. The storage probe reads at most one listing ID, not every schema table/workflow. Real database startup remains unverified here.

| Variable | Required/default | Accepted contract |
| --- | --- | --- |
| `NODE_ENV` | Defaults to `development`; npm scripts select development/production | `development`, `production` or `test` only. |
| `STORAGE_MODE` | Defaults to `database` | `database` or explicit `memory`. Use `memory` for credential-free, ephemeral local runs. No silent fallback. |
| `DATABASE_URL` | Required in database mode | PostgreSQL URL (`postgres:`/`postgresql:`) with hostname and database name, no raw whitespace or fragment. Any supplied nonempty value is syntax-checked, even in memory mode. No real URL is supplied by this repo; Amartya provides approved compatible configuration. |
| `PORT` | Defaults to `5000` | Complete decimal integer **1–65535**, no trailing text, whitespace, fractional/scientific notation or port zero. Binds `0.0.0.0` on that one HTTP port. Bind failures name PORT. |
| `COOKIE_SECURE` | Defaults to `false` for local HTTP | Exact `true` or `false`. Real HTTPS hosting requires secure cookies; this flag does not configure TLS or trusted proxy handling. |
| `OPENAI_API_KEY` | Optional; unset/empty disables external AI | Non-whitespace token when supplied. No prefix/credential is guessed and no provider call is made at startup. Manual workflows work without it; AI endpoints remain unavailable without a key. |
| `OPENAI_BASE_URL` | Optional; requires `OPENAI_API_KEY` if set | HTTPS, or HTTP on `localhost`, `127.0.0.1` or `[::1]` for a local stub. No userinfo, query, fragment or raw whitespace. Never accepted from browser input. |
| `ORGANIZATION_REVIEWER_IDS` | Optional; unset/empty means no reviewer | Unique comma-separated UUID references to **existing trusted accounts selected by Amartya**. Whitespace around entries is trimmed and UUID case normalized. Invalid, duplicate, empty or nonexistent references fail startup; no accounts/roles are created automatically. |

Unset optional settings use the defaults above. Explicit empty `NODE_ENV`, `STORAGE_MODE`, `PORT` or `COOKIE_SECURE` is invalid. No key belongs in source, PR bodies or issue comments; inject approved secrets through the chosen runtime environment. `.env` files are not automatically loaded.

A fresh memory store contains no accounts, so leave `ORGANIZATION_REVIEWER_IDS` unset for that mode; pending review is honest, but real reviewer approval needs persisted existing account references and Amartya's selection. Optional external AI credentials are not validated against a live service at startup.

Build with `npm ci && npm run build`, then run `STORAGE_MODE=memory npm start` for a local production-bundle check. The existing **`GET /health/live`** and **`GET /health/ready`** endpoints share the configured HTTP port and require no authentication. Before validation/preflight completes, there is no listener; an invalid startup must not serve either endpoint. After listening, liveness returns 200 `alive`; readiness returns 200 `ready` only when its bounded storage probe succeeds, otherwise 503 `not_ready`. See the health section for the one-second readiness bound and ten-second shutdown deadline.

**Owner-blocked release gates:** Amartya supplies DATABASE_URL, approves schema/migration execution and deployment configuration, and chooses real reviewer IDs. No real database was provisioned, connected or migrated for this slice. The chosen HTTPS proxy/origin/cookie contract still needs a separate fix and verification: setting COOKIE_SECURE does not change the current request-protocol/Origin comparison. Durable uploads, shared sessions and real deployed probes/restarts are not established by local startup success. No public deployment URL is verified.

## Tests

`npm run check`, `npm run build` and `npm test` cover the API in development/production memory mode, account/ownership controls, reservation races/transitions/expiry, organization association, sensor validation/provenance, manual observations and confirmed impact. AI integration is tested against a loopback stub with a generated ephemeral test token, including invalid-provider-output rejection; it never uses a real key/service.

The Playwright test uses two isolated browser accounts to post food, record measurements/observations, reserve, collect and confirm, inspect impact and check mobile overflow:

```sh
npx playwright install chromium
npm run test:browser
# If a system Chromium is already installed:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
# Exercise the same browser flows against the development server:
PLAYWRIGHT_DEV=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

Startup subprocess tests were first run against unchanged merged main (15 cases: 4 passed, 11 failed, 0 skipped), then against the fix. Config tests cover parsing/redaction and a shared storage/reviewer deadline with controlled local dependencies; no real database or provider credentials are used. Runtime tests also cover health status/error redaction, bounded shared probes, draining, both termination signals with an in-flight request, resource cleanup failures, forced deadlines and built production probes. CI on Node 22 runs type checking, build, API tests and Chromium browser coverage. Build warnings for outdated Browserslist data and PostCSS remain. Coverage is not exhaustive: production session persistence, database runtime tests, independent food-safety verification, hardware telemetry and deployment hardening remain follow-ups. Deterministic session-expiry HTTP tests cover the instant before expiry, the exact 12-hour boundary, stale-cookie rejection and fresh-login/logout behavior. Membership and review tests cover permission boundaries, consent, revocation, self-review denial, audit history and invalidation.

## Licence and program log

[MIT LICENSE](LICENSE) matches the package declaration. No contradictory tracked-text licence notice was found in Day 2; third-party licences and binary asset provenance were not audited. Historical [DB-VERIFICATION.md](DB-VERIFICATION.md), `INSTRUCTIONS.md` and `replit.md` describe older snapshots or aspirations, not current feature guarantees. This README is the current status.

See [AGENTS.md](AGENTS.md) for branch, PR, test and reporting rules. Daily reports: [issue #1](https://github.com/Amartya2001-droid/Foodloop/issues/1).
