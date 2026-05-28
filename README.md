# SkyGini Flight Search — Home Assignment

A small React app that searches flights via the SkyGini API and displays results in a table, with a highlighted "Best Flight" and a simple in-memory cache.

## Stack

- Vite + React + TypeScript (frontend only, no backend)
- Plain React state — no Redux, no UI library

## Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173.

The API key is read from `.env.local` (gitignored). Copy `.env.example` and fill in the key:

```bash
cp .env.example .env.local
# then set SKYGINI_API_KEY in .env.local
```

## Project layout

```
src/
  App.tsx              # form, results table, cache — the whole UI
  index.css            # global styles
  lib/
    types.ts           # SearchParams, FlightLeg, FlightOption
    bestFlight.ts      # totalDurationMinutes + pickBestIndex
```

## How it works

### 1. Search form (`App.tsx`)
Four inputs: origin, destination (both auto-uppercased), departure date, return date. On submit, validation runs first — IATA codes must match `/^[A-Z]{3}$/`, origin and destination must differ, return must be on or after departure. If validation fails, an error message is shown and no network call is made.

### 2. API call (`App.tsx`)
The form POSTs to `/api/search`, which the Vite dev server proxies to `api.skygini.com`. The proxy adds the `X-API-Key` header server-side, so the key never reaches the browser. Before making the call, we check the cache.

### 3. Best flight logic (`lib/bestFlight.ts`)
`pickBestIndex` walks the results array once:
- Lowest price wins.
- If two prices are equal (compared rounded to 2 decimals, to avoid float-precision issues like `1441.1799999999998`), shortest total duration wins.

`totalDurationMinutes` sums `(arrival - departure)` across all legs of the option.

The winning row gets a green background and a "Best" badge.

### 4. Cache (`App.tsx`)
A `useRef<Map<string, FlightOption[]>>` holds the cache. `useRef` persists across re-renders without causing them — ideal for this use case. The key is `"ORIGIN|DEST|departDate|arriveDate"`. On every submit:
- Cache hit → use stored results, show `(cached)` label, skip network call.
- Cache miss → fetch, store result in the map.

The cache lives for the page lifetime. A full page reload clears it, which matches "session-level" cache from the spec.

## Assumptions

- Prices are USD (the API doesn't return a currency field).
- "Total duration" = sum of all leg flying times. Chosen for simplicity — it makes the price tie-break meaningful.
- "Airlines" = unique carrier codes across all legs, comma-joined. No code-to-name mapping (would need a static lookup table).
- Session = page lifetime (in-memory, clears on reload).
- The API key lives in `.env.local` (gitignored). It is included in the ZIP submission for convenience since it was provided in the assignment PDF. In production it would live in a backend server and never reach the client.

## AI Usage

- **Tool used:** Claude Code (Opus 4.7)
- **What I asked it to help with:** scaffold the Vite project, write the initial versions of `App.tsx`, `bestFlight.ts`, and `types.ts`, and help structure the README.
- **AI-generated / AI-assisted:** the scaffold (`npm create vite`), initial file structure, form JSX, table rendering, and CSS.
- **Decisions I made myself:** use plain React instead of Next.js (I know React better and the assignment allows frontend-only), the cache key format, rounding prices before the tie-break comparison, testing the API with a real curl before writing any code.
- **One issue I noticed:** the API returns float prices like `1441.1799999999998`. Without rounding, a price tie-break would silently fail because `===` would return false for two prices that look equal. The fix is `Math.round(n * 100) / 100` before comparing — simple and easy to explain.
- **What I would improve with more time:**
  - Unit tests for `pickBestIndex` (lowest price, tie-break, empty input, float edge case)
  - Move the API key to a backend proxy so it's not visible in the browser
  - Airline code → airline name mapping
  - Sort/filter controls on the results table
  - Show number of stops per option
  - LRU cap on the cache so it can't grow indefinitely

## What is incomplete

All required features are implemented. The "would improve" list above is polish left out to stay in the timebox.
