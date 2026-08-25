# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Health Symptom Checker — a web app where users describe symptoms and get a calm, structured AI analysis (Claude), plus nearby doctor/pharmacy search via Google Maps. Optional JWT-based accounts let users save history.

- Frontend: `fe/` — Create React App (React 19, react-router-dom v7), deployed to Netlify.
- Backend: `backend/` — Express + Mongoose, deployed to Render at `https://ai-health-check.onrender.com`.

## Current Status / Next Steps

- **Phase 1 (Claude-based symptom analysis)** — done, pushed.
- **Phase 2 (guided multi-step symptom intake form)** — done, pushed.
- **Phase 3 (doctor/pharmacy search: geolocation, reliability fixes, new UI)** — done, pushed.
- **Phase 4 (sign-in + MongoDB history)** — not started. Before testing this locally, **the current machine's IP needs to be whitelisted in MongoDB Atlas's Network Access settings** — `MONGO_URI` connections have been failing in dev (DNS/connection error on `mongoose.connect`).
- **Phase 5 (final UI polish)** — not started.

## Commands

### Backend (`backend/`)
```bash
cd backend
npm install
npm start        # node src/server.js — the real entry point (listens on PORT, default 5001)
npm run dev       # nodemon src/server.js
```
Note: `backend/index.js` is a separate, minimal Express stub (health-check route only) and is **not** what `npm start` runs — the actual API lives entirely in `backend/src/server.js`.

Requires a `.env` in `backend/` with:
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret
- `ANTHROPIC_API_KEY` — Claude API key (symptom analysis)
- `GOOGLE_MAPS_API_KEY` — Google Maps Geocoding/Places API key

There is no test suite or linter configured for the backend.

### Frontend (`fe/`)
```bash
cd fe
npm install
npm start         # dev server on http://localhost:3000
npm run build      # production build (react-scripts)
npm test           # CRA/Jest test runner (only App.test.js exists, using default CRA smoke test)
```
Tailwind (`tailwindcss`, `postcss`, `autoprefixer`) is present in devDependencies but styling is currently done via `App.css`/`index.css`/`styles.css` and inline `style={{...}}` objects in components — check before assuming Tailwind classes are wired up in a given file.

## Architecture

### Backend — single-file API (`backend/src/server.js`)
Everything (DB connection, schemas, and all routes) lives in this one Express file — there is no router/controller/service split. When adding a route, follow the existing pattern: inline route handler, try/catch with a `console.error` + JSON `{ error }` response.

- **Auth**: `POST /create-account`, `POST /login` — bcrypt-hashed passwords, JWT issued on login (`expiresIn: '1h'`). The `User` model (`backend/models/User.js`) only stores `email`/`password`; there's no server-side auth middleware protecting routes — the frontend gates routes client-side (see below).
- **History**: `POST /save-symptoms`, `POST /save-doctor-search`, `POST /save-pharmacy-search`, `GET /user-history` — all keyed by `email` (not user ID) against a `UserHistory` model defined inline in `server.js` (not in `backend/models/`).
- **AI analysis**: `POST /symptoms` — calls Claude (`claude-sonnet-5` via `@anthropic-ai/sdk`) with a forced tool call (`tool_choice: { type: 'tool', name: 'provide_symptom_analysis' }`, `strict: true`) so the response is always valid structured JSON, never free text. The `SYMPTOM_ANALYSIS_SYSTEM_PROMPT` in `server.js` encodes this product's core tone requirement: lead with the most likely everyday explanations first (not the scariest), warm non-alarming language, urgency escalated only when genuinely warranted. The returned shape is `{ overallUrgency, disclaimer, possibleConditions: [{condition, likelihood, explanation}], selfCareSteps, whenToSeeADoctor }` — when changing this schema, note that Claude's strict tool validation rejects `minItems`/`maxItems` other than 0 or 1 on array properties; express count constraints in the field's `description` text instead.
- **Location search**: `POST /find-pharmacies`, `POST /search-doctors` — resolve an origin from either `lat`/`lng` (browser geolocation, preferred) or a geocoded `city` fallback (`resolveOrigin` in `server.js`), then query Google Places `nearbysearch` with progressive radius widening (5/15/40 km, `nearbySearchWithWidening`) and haversine-sorted distance. Google's `status` field is checked explicitly (an empty `results` array on a quota/auth error must not be treated as "no results"), and the `opennow` Places param (not `open_now`) is required for the open-now filter to work. `urgency: 'emergency'` is rejected server-side — the frontend never calls this endpoint for emergencies, showing a dedicated panel instead. `GET /place-details` does a lazy, per-place Details lookup (hours/phone) for a single result on demand.

### Frontend (`fe/src`)
- `App.js` defines all routes and a `PrivateRoute` wrapper that gates `/dashboard` by checking `localStorage.getItem('token')` — this is the only route protection; there's no token refresh/expiry handling.
- `components/Navbar.js` reads `token`/`email` from `localStorage` directly to render logged-in vs. logged-out state and handle logout.
- `pages/` — one file per route (`HomePage`, `SignIn`, `SymptomCheck`, `ContactDoctor`, `Findpharmacy`, `Dashboard`). `SymptomCheck.js`, `ContactDoctor.js`, and `Findpharmacy.js` read `process.env.REACT_APP_API_BASE_URL`, falling back to the production URL, so a local `fe/.env.local` (gitignored, not committed) with `REACT_APP_API_BASE_URL=http://localhost:5001` points local dev at a local backend. `SignIn.js` and `Dashboard.js` still call the backend with a **hardcoded** production URL via `axios` and haven't been migrated to this pattern yet — no shared API client module exists.
- `components/Chip.js` — the pill-style selectable button used across `SymptomCheck`, `ContactDoctor`, and `Findpharmacy`; the one piece of UI shared between pages so far (everything else is duplicated per-page inline styles, matching this codebase's existing convention).
- No shared auth/data context or state library (no Redux/Context) — logged-in state and history data are re-fetched/read from `localStorage` independently in each component that needs them.

## Deployment
- Frontend: Netlify serves the **committed** `fe/build/` directory directly (live at `ai-health-check.netlify.app`) rather than running its own build step — after any change under `fe/src`, regenerate it with `cd fe && npm run build` and commit the result, or the deployed site won't reflect the change. Build with `.env.local` absent/unset so the production bundle keeps the production API URL fallback rather than baking in a local override.
- Backend deploys to Render from `backend/` (`ai-health-check.onrender.com`), started via `npm start` → `node src/server.js`.
