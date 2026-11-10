# FoodLoop AI

Food redistribution hackathon prototype built with React, Vite, Express, TypeScript and Drizzle. Day 1 audit for the Nov 11, 2026 brief, performed Nov 10, 2026. This repository contains application code, not just a proposal.

**Live status: not live yet — blocked by deployment configuration, a provisioned database, and production security work.** No working public deployment has been verified. The previous README's `https://foodloop.replit.app` was labelled a demo and is not an established live URL.

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

The package metadata says MIT, but no LICENSE file is tracked. A licence grant has not been verified; the owner must clarify it. No licence has been added or invented.
