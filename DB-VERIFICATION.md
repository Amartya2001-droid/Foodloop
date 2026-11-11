# Day 2 — schema and local workflow verification (Nov 11, 2026)

Standing rules: work on a branch and open a PR for every change; tests pass before opening the PR (add smoke coverage where absent); never commit secrets or invent credentials, licences or metrics; keep the README honest about working and live behavior; finish by commenting on daily-log issue #1 and stop.

Baseline: latest main `89cf4dd`, including merged Day 1 PR #2. Scope is local, ephemeral `STORAGE_MODE=memory`, with database and AI environment values cleared by the tests. No Neon provisioning, database connections, schema pushes or destructive seed scripts were run. No auth or reservation features were built.

## Declared Drizzle schema

`shared/schema.ts` declares these PostgreSQL tables; this is source inspection, not evidence of tables deployed to a real database.

| Table | Data and constraints |
| --- | --- |
| `users` | UUID-text primary key, unique required username, required password; no password hashing in storage |
| `food_listings` | Food/location/quality details, nullable expiry and pickup timestamps, donor ID, status default `available`, creation timestamp; donor ID has no foreign key |
| `sensor_data` | Listing ID, temperature, humidity, timestamp; listing ID has no foreign key |
| `claims` | Listing ID, claimer name/contact, timestamp, status default `pending`; no foreign key or identity-bound recipient |
| `organizations` | Name/type/location/contact, optional website/image, verified default false |
| `supplier_ratings` | Supplier and organization foreign keys to users/organizations; scores, optional Google score/analysis, certification flag, totals and timestamps |

All six have generated primary keys. No reservation uniqueness constraint or status enum/check is declared. `MemStorage` uses six process-local maps and application UUIDs/dates; it does not apply PostgreSQL uniqueness, foreign keys or transaction guarantees. Passing memory tests does not verify migrations, SQL defaults, concurrency or database integrity. Sensor ordering differs in source: memory newest first, database oldest first.

## Reproduce

Use Node 22 as configured in CI: `npm ci`, `npm run check`, `npm run build`, `npm test`. Smoke tests run development and built production servers in memory mode with no credentials. An additional isolated Express fixture server uses the same routes/storage to populate a disposable organization and supplier rating through storage methods. Its clearly synthetic data never reaches a real database and is not production seeding.

## Endpoint observations

| Endpoint | Memory result and limits |
| --- | --- |
| `GET /api/food-listings` | 200 empty initially; includes newly created available listing; excludes it after status becomes claimed |
| `POST /api/food-listings` | 201 for valid multipart fields; 400 for empty form. Pickup start/end must currently parse as dates even though schema columns are nullable. No-image path verified; file upload success not covered |
| `GET /api/food-listings/:id` | 200 for created listing, 404 after deletion |
| `PATCH /api/food-listings/:id` | 200 status update; missing ID 404. Only status is forwarded, but its value/transitions are not validated; creates no claim |
| `DELETE /api/food-listings/:id` | 204 then missing GET 404; missing DELETE 404 |
| `GET /api/my-listings` | 404 `Donor not found` in normal empty memory startup: route looks up hardcoded `hope_food_bank`, not the current user |
| `GET /api/organizations` | 200 empty normally; 200 with temporary organization fixture |
| `GET /api/organizations/:id` | 404 normally for unknown ID; 200 fixture detail joins supplier username and listing counts |
| `POST /api/organizations` | No route; isolated route test returns 404. Organization creation, user creation and rating creation are storage methods only, not exposed APIs |
| `GET /api/sensor-data/:listingId` | 200 empty initially, then returns posted reading |
| `POST /api/sensor-data` | 201 valid numeric reading; 400 invalid body. Not authenticated device telemetry |
| `POST /api/chat` | 503 with valid messages and no AI key; independent of database |
| `POST /api/detect-food` | Source inspection: 400 without upload, 503 with upload but no AI key. Successful AI call not verified |

No registered listing/organization/sensor endpoint inherently requires a database when memory mode is selected. Organization/supplier screens and the monitor are unusable with normal empty startup data because required records and creation APIs are absent; a real database alone does not implement those workflows. Missing auth/claim endpoints are missing in both storage modes. The complete app serves an HTML fallback for some unknown GET paths, so an HTML 200 is not evidence of an API.

Database mode (default when memory is not selected) imports `server/db.ts`, requires a real `DATABASE_URL`, and has no memory fallback. Database-backed endpoint results remain unverified and blocked on Amartya's database provisioning. Data disappears on process restart. No production/live deployment was verified; README live status remains unchanged.

## Licence review

`package.json` declares MIT; the lockfile root metadata was also checked. Before adding LICENSE, a case-insensitive search of tracked text for copyright, licence/license, SPDX and all-rights-reserved notices found only the MIT package declaration, the README's missing-licence note and the generic `INSTRUCTIONS.md` License & Credits heading. No contradictory notice was found. Added the standard MIT text with contributor attribution rather than inventing an individual rights holder or year. This review does not establish provenance of binary image assets or audit third-party dependency licences.

## Day 2 validation and follow-up

Local validation passed on the environment's Node v24.22.1: `npm run check`, `npm run build`, and `npm test` (3 cases: development smoke, production smoke, organization fixture integration). CI targets Node 22; its result is separate from this local run. Build emitted existing Browserslist-age and PostCSS warnings. Initial dependency installation failed because the default npm cache path was unavailable; installation succeeded with a writable workspace cache, with no dependency or lockfile changes.

Triage issues (implementation deferred):
- [#3 — authentication and authorization](https://github.com/Amartya2001-droid/Foodloop/issues/3)
- [#4 — reservation and pickup workflow](https://github.com/Amartya2001-droid/Foodloop/issues/4)
- [#5 — mock sensor, quality, impact and supplier displays](https://github.com/Amartya2001-droid/Foodloop/issues/5)
