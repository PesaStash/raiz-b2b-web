# Raiz Business (raiz-b2b-web)

Web app for Raiz business accounts: wallets, payouts, collections, invoices,
bill requests, team members, Gateway and developer tools. It talks to
**RaizServer** (`/business/*`, `/b2b/*`) and also hosts the public guest-pay
page at `/pay/[raizTag]`.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 3 · React Query ·
Zustand · Formik + Zod.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev                     # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` | ESLint (flat config, `eslint-config-next`) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit tests in `tests/` (Node's test runner) |

CI (`.github/workflows/ci.yml`) runs lint, type check, tests and build on every
pull request and on pushes to `dev`, `staging` and `main`.

## How auth works

The RaizServer access token never reaches page scripts.

- The browser calls **`/api/raiz`** (same origin) for every RaizServer request.
  `src/lib/apiClient.ts` puts the RaizServer path in the `x-raiz-path` header.
- `src/app/api/raiz/route.ts` reads the token from the **httpOnly
  `raiz_session` cookie**, adds `Authorization: Bearer …` and the client IP,
  and forwards to `RAIZ_API_URL`. Only allow-listed path prefixes are
  forwarded (`src/lib/server/raizProxy.ts`).
- On a successful `POST /business/auth/login/otp/` the proxy moves the token
  into the cookie and strips it from the response body. Logout and any 401
  clear the cookies.
- Scripts only see `raiz_auth=1`, a hint cookie used for UI decisions
  (`hasSession()` in `src/utils/CookiesFunc.ts`).
- Cookie-authenticated routes require the `x-raiz-client: web` header and a
  same-origin request (CSRF guard).
- `src/proxy.ts` (Next 16's replacement for `middleware.ts`) redirects to
  `/login` when the session cookie is missing or expired. RaizServer still
  validates the token on every call; role checks in
  `src/lib/permissions.ts` are defence in depth only.

## Layout

```
src/
  app/(auth)/         login, register, verify, forgot password, accept invite
  app/(dashboard)/    signed-in app (sidebar layout)
  app/pay/[raizTag]/  public guest-pay page
  app/api/            raiz (proxy), auth/session, payment-proof
  lib/server/         server-only rules (session cookies, proxy, file checks)
  services/           RaizServer API calls (axios)
  store/              Zustand stores
```
