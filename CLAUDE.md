# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server at localhost:4321
npm run build    # Production build → dist/
npm run preview  # Preview built site
```

There are no tests. Build is the main validation — always run `npm run build` after changes to catch TypeScript/Astro compilation errors.

## Architecture

**Stack:** Astro 5 (SSR, Netlify edge adapter) + Vue 3 (interactive islands) + React (TanStack Table only) + SCSS + Supabase + Resend + OpenAI.

### Rendering model
The site runs in `output: 'server'` mode on Netlify Edge Functions. Most pages use `export const prerender = true` for static rendering. API routes and auth-dependent pages are SSR. Components use Astro's island architecture — Vue components need `client:only="vue"` when they access `localStorage` (to avoid SSR hydration mismatches); `client:load` or `client:visible` for others.

### Layout hierarchy
```
BaseLayout.astro   ← HTML shell, meta tags, GA (Partytown), Service Worker
  └── Layout.astro ← Nav + ContractedPower banner + Footer + CookieBanner
        └── page content (slot)
```

### State management (nanostores)
Three stores; all persist to `localStorage` via `@nanostores/persistent`:

| Store | File | Purpose |
|---|---|---|
| `prices.js` | `src/stores/prices.js` | ESIOS electricity price data, contracted power, today/tomorrow toggle |
| `consumptionStore.ts` | `src/stores/consumptionStore.ts` | User appliances list, profile (tariff + power). Bidirectionally synced with `prices.js` `power` atom. |
| `authStore.ts` | `src/stores/authStore.ts` | Supabase Auth session, user profile (free scans used, subscription status) |

### Data flow for electricity prices
`/api/prices` (Astro endpoint) → fetches ESIOS API (indicator 1001) → caches in Supabase `cache` table (1h TTL) → `prices.js` store → Vue components. The cache layer (`src/lib/cache.js`) uses Supabase as a server-side key-value store with `upsert` on key `'precios-electricos'`.

### Navigation
Defined in `src/constant/index.js` as the `navigation` array. Items with `children` render as dropdowns. Items with `isAI: true` get the purple star icon treatment in Nav.astro. Nav is a pure Astro component (no hydration needed).

### Invoice scanning feature (`/escanear-factura`)
- **Auth:** Supabase Auth (email/password). `AuthModal.vue` handles login/register. `initAuth()` must be called in `onMounted` of any component that reads auth state.
- **Gate:** 1 free scan per account, then requires subscription. Checked server-side in `/api/scan-invoice.ts` against `user_profiles.free_scans_used`.
- **OCR flow:** Vue component uploads image → `POST /api/scan-invoice` with `Authorization: Bearer <token>` → server verifies token via `supabase.auth.getUser()` → OpenAI GPT-4o-mini Vision → saves to `scanned_invoices` table + Supabase Storage bucket `invoices`.
- **Dashboard:** `InvoiceDashboard.vue` uses `vue-chartjs` — Doughnut (gastos por categoría) + Bar (evolución mensual).

### Supabase tables
| Table | Purpose |
|---|---|
| `cache` | Server-side price cache (key/value + timestamp) |
| `subscribers` | Newsletter subscriptions with email confirmation tokens |
| `user_profiles` | Extended auth profiles: `free_scans_used`, `is_subscribed`, `subscription_end` |
| `scanned_invoices` | OCR results: extracted fields + `extracted_data` JSONB + image path |

`supabaseClient.js` exports two clients: `supabase` (anon key, used everywhere) and `supabaseAdmin` (service role, only in server-side API routes to bypass RLS).

### SCSS design system
CSS custom properties are generated from SCSS token maps at build time via a mixin in `_mixins.scss`. The token pipeline is:

```
_seed-tokens.scss → _map-tokens.scss → _alias-tokens.scss → _root.scss (→ CSS vars)
```

Use CSS vars in components: `var(--primary-900)`, `var(--space-m)`, `var(--size-1)`, `var(--rounded-md)`. The primary palette is dark blue (navy). Accent colors: `--esmerald-green`, `--amber`, `--orange`, `--red`. Utility classes like `text-neutral-50`, `bg-primary-800`, `mt-space-l`, `fw-700`, `rounded-md` are generated from the token maps and usable directly in templates.

### Charts
Two components in `src/components/charts/`:
- `BarChart.js` — re-exports `Bar` from vue-chartjs, registers CategoryScale + LinearScale + BarElement
- `DoughnutChart.js` — re-exports `Doughnut`, registers ArcElement

Import and use as standard Vue components. Chart options follow the project's color palette (dark background, `#e5e7eb` tick labels, `rgba(255,255,255,0.07)` grid lines).

### API routes
All in `src/pages/api/`. Must export named HTTP method handlers (`GET`, `POST`). Need `export const prerender = false` if the page would otherwise be prerendered.

### Environment variables
| Variable | Where used |
|---|---|
| `PUBLIC_SUPABASE_URL` | Client + server (prefixed `PUBLIC_`) |
| `PUBLIC_SUPABASE_ANON_KEY` | Client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (API routes, never expose to client) |
| `RESEND_API_KEY` | Server only (`/api/subscribe`) |
| `ESIOS_TOKEN` | Server only (`/api/prices`) |
| `OPENAI_API_KEY` | Server only (`/api/scan-invoice`) |
| `PUBLIC_BASE_URL` | Email links in subscribe endpoint |

### Content (blog/tips)
MDX files in `src/tips/`. Rendered via Astro Content Collections. Dynamic routes at `/tipsyguias/[id]` and `/calculadora-consumo-[slug]` (the latter generated from the `appliances` array in `src/constant/index.js`, which contains ~50 appliances with full SEO metadata).
