# Top Miles Logistics — driver recruiting site

Production-ready Next.js site for **Top Miles Logistics**: a public job page for
OTR CDL-A drivers, a full DOT-style online application, and a password-protected
recruiting dashboard.

- **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Prisma ·
  PostgreSQL
- **Deploy target:** Vercel (works on any Node host)

---

## Quick start

```bash
npm install
cp .env.example .env              # then fill in the values (see below)
npm run db:migrate                # creates the tables
npm run dev                       # http://localhost:3000
```

Use `.env` rather than `.env.local`: Next.js reads both, but the Prisma CLI
only reads `.env`, so migrations fail without it. Both are gitignored.

### Generating the secrets

```bash
# Admin password hash (never store the plaintext)
npm run hash-password -- "a-long-strong-password"

# Session signing secret and IP hashing salt
openssl rand -base64 48
openssl rand -base64 32
```

Paste the results into `.env` as `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` and
`IP_HASH_SALT`. The app validates all of these at boot and refuses to start with
a weak or missing value, so a misconfiguration fails loudly instead of quietly
disabling security.

> **Escape the `$` in the bcrypt hash inside `.env` files.** Next.js expands
> variables in `.env`, so `$2a$12$abc...` is read as three empty variable
> references and the hash silently arrives truncated — every login then fails
> with no obvious cause. Write it as `\$2a\$12\$abc...`. The `hash-password`
> script prints the correctly escaped form for you. Values set in the **Vercel
> dashboard are not expanded**, so paste the raw hash there.

---

## ⚠️ Before you launch: fill in the placeholders

Everything the company confirmed is already in the site. Values that were **not**
provided are rendered as obvious dashed-outline placeholders like
`[COMPANY EMAIL]` so they cannot ship by accident.

All of them live in one file: **`src/config/site.ts`**

| Placeholder           | Where it appears        |
| --------------------- | ----------------------- |
| `[COMPANY EMAIL]`     | Footer, privacy policy  |
| `[OFFICE ADDRESS]`    | Footer, privacy policy  |
| `[MC NUMBER]`         | Footer                  |
| `[DOT NUMBER]`        | Footer                  |
| `[RECRUITING HOURS]`  | Unused until filled in  |

Also set `NEXT_PUBLIC_SITE_URL` to the real domain — it drives canonical URLs,
`sitemap.xml`, `robots.txt` and Open Graph tags.

**Content rule:** this site contains no testimonials, reviews, driver earnings
claims, awards, company history, fleet size or safety statistics, because none
were supplied. Do not add any that the company has not confirmed — job postings
that misstate terms get penalised by Google and create legal exposure.

---

## Project structure

```
prisma/schema.prisma              Data model (applications + rate limiting)
scripts/hash-password.mjs         bcrypt hash generator for the admin password
scripts/e2e-test.mjs              API, security and SEO test suite
scripts/browser-test.mjs          Full UI walkthrough in Chromium
src/
  config/site.ts                  ← ALL company facts and placeholders
  content/faq.ts                  FAQ copy (facts only)
  lib/
    env.ts                        Validates server env vars at boot
    prisma.ts                     Prisma singleton
    session.ts                    JWT session (Edge-safe)
    auth.ts                       Credential check + session guards
    rate-limit.ts                 Database-backed rate limiter
    hash.ts                       IP hashing (raw IPs are never stored)
    validation.ts                 Zod schemas — shared by client AND server
  middleware.ts                   Blocks anonymous requests to /admin
  components/                     Reusable UI, form fields, admin pieces
  app/
    (site)/                       Public pages (header + footer)
      page.tsx                    Homepage
      apply/page.tsx              Application
      apply/submitted/page.tsx    Confirmation
      privacy/page.tsx            Privacy policy
    admin/                        Dashboard (auth required, noindex)
    api/apply/route.ts            Application submission
    api/auth/login|logout         Admin sign-in
    api/admin/export/route.ts     CSV export
    opengraph-image.tsx           Social sharing preview
    icon.svg, favicon.ico,
    apple-icon.png                Favicons + Apple touch icon
    robots.ts, sitemap.ts         SEO
```

---

## Security

| Concern                  | How it is handled                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Secrets                  | Only ever read from environment variables, validated by `src/lib/env.ts`. Nothing is committed.          |
| Admin auth               | bcrypt-hashed password, HS256 JWT in an `httpOnly` `secure` `sameSite=lax` cookie, 8-hour expiry.        |
| Route protection         | `middleware.ts` blocks `/admin/*` and `/api/admin/*`; every page and route **also** re-checks the session. |
| Input validation         | One Zod schema, run in the browser for UX and **again on the server** — the server never trusts the client. |
| Injection                | Prisma parameterises all queries. CSV export escapes formula-leading characters.                        |
| CSRF                     | `sameSite=lax` cookie plus an explicit `Origin` check on every state-changing route.                     |
| Rate limiting            | Database-backed, so it holds across serverless instances. Two separate limits on the form: 30 requests/hour/IP (generous, so a driver fixing validation errors is never locked out) and 3 *created* applications/hour/IP. Sign-in: 8 attempts/15 min/IP. |
| Spam / bots              | Hidden honeypot field plus a minimum fill-time check.                                                    |
| Duplicate submissions    | Unique `submissionToken` (double-click / retry safe) and unique email (one application per driver).       |
| Applicant privacy        | Dashboard is `noindex`, `no-store`, and disallowed in `robots.txt`. Raw IPs are hashed, never stored.     |
| Error handling           | Internal errors are logged server-side; clients get a generic message with no stack traces or internals.  |
| Transport / headers      | HSTS, CSP, `X-Frame-Options: DENY`, `nosniff`, referrer policy, permissions policy (see `next.config.ts`). |

---

## SEO

- Keyword-targeted title and meta description (CDL-A jobs, OTR truck driver
  jobs, CDL driver jobs, OTR trucking jobs, Dry Van driver jobs, Reefer driver
  jobs, truck driver jobs in Ohio, Top Miles Logistics)
- One `<h1>` per page with a correct heading hierarchy underneath
- `JobPosting`, `Organization` and `FAQPage` JSON-LD — using confirmed facts only
- Open Graph + Twitter card metadata with a generated 1200×630 preview image
- SVG favicon, `favicon.ico` fallback, and a 180×180 PNG Apple touch icon
- `sitemap.xml` and `robots.txt`, with `/admin` and `/api` excluded
- Canonical URLs on every public page

---

## Deploying without installing anything

The whole project can be set up from a browser — no Node, no Docker, no admin
rights on your machine:

1. **Database** — create a free project at [neon.com](https://neon.com) and copy
   the connection string.
2. **Code** — at [github.com/new](https://github.com/new) create a private
   repository, choose *uploading an existing file*, and drag in the unzipped
   project folder (89 files, under GitHub's 100-file web-upload limit).
3. **Host** — import that repository at [vercel.com/new](https://vercel.com/new)
   and add the environment variables listed below. Paste the **raw** bcrypt hash
   here; the `\$` escaping is only needed in local `.env` files.
4. Deploy. Tables are created automatically by the build.

To edit afterwards, open any file on GitHub, click the pencil icon, commit, and
Vercel redeploys in about a minute. Committing to a branch instead of `main`
gives you a private preview URL to check before it goes live.

Note that Vercel's free Hobby plan is restricted to non-commercial use, so a
live recruiting site needs the Pro plan.

---

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Create a Postgres database (Vercel Postgres, Neon, or Supabase).
3. Set the environment variables from `.env.example` in
   **Project → Settings → Environment Variables**:
   `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `IP_HASH_SALT`.
4. Deploy. The build script runs `prisma generate && prisma migrate deploy`
   before `next build`, so the tables are created (and future migrations
   applied) automatically on every deploy — there is no separate migration step
   and no need for a local terminal.

`NODE_ENV=production` makes the session cookie `secure`, so the dashboard
requires HTTPS in production — which Vercel provides by default.

---

## Maintenance

- **Change any company fact** → `src/config/site.ts` (one place, used everywhere)
- **Change FAQ copy** → `src/content/faq.ts`
- **Add an application field** → `prisma/schema.prisma`, `src/lib/validation.ts`
  (schema + `STEP_FIELDS`), the matching step in
  `src/components/form/ApplicationForm.tsx`, and the API route's `create` call
- **Rotate the admin password** → `npm run hash-password -- "new-password"` and
  update `ADMIN_PASSWORD_HASH`
- **Add a second recruiter login** → replace the env-based single admin in
  `src/lib/auth.ts` with an `AdminUser` table; the session layer needs no changes

---

## Tests

Both suites run against a server that is already up, with a migrated database.

```bash
# API + security + SEO surface (72 assertions)
ADMIN_EMAIL="you@example.com" E2E_ADMIN_PASSWORD="the-plaintext-password" \
  node scripts/e2e-test.mjs http://127.0.0.1:3000

# Real browser: fills all seven steps, submits, signs in, updates status.
# Writes screenshots to ./screenshots (41 assertions)
node scripts/browser-test.mjs http://127.0.0.1:3000
```

The browser suite needs Playwright:

```bash
npm i -D playwright && npx playwright install chromium
```

Run these against `npm run dev`, not `npm start`. In production the session
cookie is `Secure`, so the dashboard correctly refuses to sign in over plain
HTTP — the admin assertions will fail against a local production server for that
reason alone. Everything else passes in both modes.
