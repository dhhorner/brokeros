# Deployment Guide

## System Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | 20+ |
| npm | 10+ |

## External Services

These managed services must be provisioned before the app will start. Self-hosted alternatives are noted where applicable.

### PostgreSQL (required)

The app uses Supabase as the hosted PostgreSQL provider. Prisma requires **two** connection strings:

- `DATABASE_URL` — pooled connection via pgBouncer (port 6543), used for all queries
- `DIRECT_URL` — direct connection (port 5432), used only for `prisma migrate`

**Supabase setup:**
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → Database → Connection string**
3. Copy the **Transaction pooler** URL → `DATABASE_URL` (append `?pgbouncer=true`)
4. Copy the **Direct connection** URL → `DIRECT_URL`

**Self-hosted alternative:** Any PostgreSQL 14+ instance works. Set both `DATABASE_URL` and `DIRECT_URL` to the same connection string (no pooler needed when self-hosting).

---

### Redis (required)

Redis is used for two things:
- **BullMQ** background job queue (workers) — needs a standard `ioredis`-compatible URL (`REDIS_URL`)
- **Server-side caching** — uses the Upstash REST SDK (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`)

**Upstash setup (recommended):**
1. Create a database at [upstash.com](https://upstash.com)
2. Copy the **REST URL** and **REST token** from the console
3. For `REDIS_URL`, use the `ioredis`-compatible URL shown in the Upstash console

**Self-hosted alternative:** Run Redis 7+ locally or via Docker:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```
Set `REDIS_URL=redis://localhost:6379` and provide a compatible REST proxy or replace Upstash SDK calls with direct ioredis calls.

---

### Google OAuth (required for auth)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add your domain to **Authorized JavaScript origins** and **Authorized redirect URIs** (`/api/auth/callback/google`)
4. Copy the client ID → `AUTH_GOOGLE_ID` and secret → `AUTH_GOOGLE_SECRET`

---

### Resend (required for email auth + notifications)

Magic-link sign-in and nurture emails both go through Resend.

1. Create an account at [resend.com](https://resend.com)
2. Verify your sending domain
3. Create an API key → `RESEND_API_KEY` and `AUTH_RESEND_KEY` (same key can be used for both)
4. Set `RESEND_FROM_EMAIL` to a verified sender address (e.g. `notifications@yourdomain.com`)

---

### Stripe (required for billing)

1. Create an account at [stripe.com](https://stripe.com)
2. Create a **Product** with a recurring **Price** for the Pro plan → `STRIPE_PRO_PRICE_ID`
3. Copy the secret key → `STRIPE_SECRET_KEY`
4. Set up a webhook endpoint pointing to `https://yourdomain.com/api/webhooks/stripe` and copy the signing secret → `STRIPE_WEBHOOK_SECRET`

For local testing, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

---

### Anthropic (required for AI features)

1. Get an API key at [console.anthropic.com](https://console.anthropic.com)
2. Set `ANTHROPIC_API_KEY`

**Local dev alternative:** Set `OLLAMA_BASE_URL` (e.g. `http://localhost:11434`) to use a local Ollama instance instead. `ANTHROPIC_API_KEY` is optional when `OLLAMA_BASE_URL` is set.

---

## Environment Variables

Copy `.env.example` to `.env.local` (development) or `.env` (production) and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pooled PostgreSQL URL (pgBouncer) |
| `DIRECT_URL` | Direct PostgreSQL URL (for migrations) |
| `AUTH_SECRET` | Random 32-char secret — generate with `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_RESEND_KEY` | Resend API key used by Auth.js for magic links |
| `RESEND_API_KEY` | Resend API key for app emails |
| `RESEND_FROM_EMAIL` | Verified sender address |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for the Pro plan (`price_...`) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `REDIS_URL` | ioredis-compatible Redis URL for BullMQ workers |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional when using Ollama) |
| `OLLAMA_BASE_URL` | Ollama base URL for local AI (optional) |
| `NEXTAUTH_URL` | Full app URL — required in production (e.g. `https://yourdomain.com`) |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL (same as `NEXTAUTH_URL`) |

---

## Install & Database Setup

```bash
# Install dependencies
npm install

# Run database migrations (uses DIRECT_URL)
npm run db:migrate

# (Optional) Seed initial data
npm run db:seed
```

---

## Running the App

### Development

```bash
npm run dev        # Next.js on http://localhost:4000
npm run worker     # Background job worker (separate terminal)
```

### Production

```bash
npm run build
npm run start      # Next.js on port 4000
```

The **worker process** must run alongside the web server. It handles:
- `nurture-email` — scheduled nurture sequence emails
- `mls-sync` — MLS property data sync
- `deal-risk-check` — AI-powered transaction risk scoring

#### Worker via Docker

A `Dockerfile.worker` is included for containerized worker deployments:

```bash
docker build -f Dockerfile.worker -t brokeros-worker .
docker run -d \
  --env-file .env \
  --name brokeros-worker \
  brokeros-worker
```

The worker and web server are independent processes — the worker does not serve HTTP traffic.

---

## Production Checklist

- [ ] All environment variables set (no placeholders)
- [ ] `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` set to the production domain
- [ ] Stripe webhook endpoint registered and pointing to `/api/webhooks/stripe`
- [ ] Google OAuth redirect URI includes the production domain
- [ ] Resend sending domain verified
- [ ] `npm run db:migrate` run against the production database
- [ ] Worker process running and connected to the same Redis instance as the web server
- [ ] Using `sk_live_` Stripe keys (not `sk_test_`)
