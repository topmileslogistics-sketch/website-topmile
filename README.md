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
cp .env.example .env.local        # then fill in the values (see below)
npm run db:migrate                # creates the tables
npm run dev                       # http://localhost:3000
```

### Generating the secrets

```bash
# Admin password hash (never store the plaintext)
npm run hash-password -- "a-long-strong-password"

# Session signing secret and IP hashing salt
openssl rand -base64 48
openssl rand -base64 32
```

Paste the results into `.env.local` as `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`
and `IP_HASH_SALT`. The app validates all of these at boot and refuses to start
with a weak or missing value, so a misconfiguration fails loudly instead of
quietly disabling security.

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
    icon.svg, apple-icon.svg      Favicons
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
| Rate limiting            | Database-backed (works across serverless instances): 5 applications/hour/IP, 8 sign-ins/15 min/IP.        |
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
- SVG favicon and Apple touch icon
- `sitemap.xml` and `robots.txt`, with `/admin` and `/api` excluded
- Canonical URLs on every public page

---

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel.
2. Create a Postgres database (Vercel Postgres, Neon, or Supabase).
3. Set the environment variables from `.env.example` in
   **Project → Settings → Environment Variables**:
   `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `IP_HASH_SALT`.
4. Run the migration against production once:
   ```bash
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   ```
5. Deploy. `npm run build` runs `prisma generate` automatically.

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
