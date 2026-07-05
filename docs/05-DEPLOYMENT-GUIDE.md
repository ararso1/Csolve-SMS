# 05 — Deployment Guide

## 1. Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18.x or 20.x LTS | Required for Next.js 14 |
| npm | 9+ | Or yarn/pnpm/bun |
| PostgreSQL | 15+ | Local, Docker, or cloud |
| Clerk account | — | [clerk.com](https://clerk.com) free tier works for dev |
| Cloudinary account | — | Optional; needed for photo uploads |
| Git | — | For version control |

---

## 2. Environment Variables

Create a `.env` file in the project root (never commit this file):

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/school_db?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs (optional — defaults work for local dev)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Cloudinary (for teacher/student photo uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Copy from template once available:

```bash
cp .env.example .env
```

---

## 3. Local Development Setup

### 3.1 Clone and Install

```bash
git clone <repository-url>
cd full-stack-school
npm install
```

### 3.2 Database Setup

**Option A — Local PostgreSQL**

```bash
# Create database
createdb school_db

# Set DATABASE_URL in .env, then:
npx prisma migrate dev
npx prisma db seed
```

**Option B — Docker PostgreSQL only**

```bash
docker run --name school-postgres \
  -e POSTGRES_USER=school \
  -e POSTGRES_PASSWORD=schoolpass \
  -e POSTGRES_DB=school_db \
  -p 5432:5432 \
  -d postgres:15

# Update .env:
# DATABASE_URL="postgresql://school:schoolpass@localhost:5432/school_db?schema=public"

npx prisma migrate dev
npx prisma db seed
```

### 3.3 Clerk Configuration

1. Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy API keys to `.env`
3. Enable **Username** and **Email** as identifiers (Settings → User & Authentication → Email, Phone, Username). The `sync-clerk` script creates users with both username and email.
4. **Critical for RBAC:** Customize session token (Sessions → Customize session token):

```json
{
  "metadata": {
    "role": "{{user.public_metadata.role}}"
  }
}
```

5. Create test users manually in Clerk Dashboard with `publicMetadata`:

```json
{ "role": "admin" }
```

Roles: `admin`, `teacher`, `student`, `parent`

6. Ensure Clerk user IDs match Prisma records (or use the in-app CRUD forms to create teachers/students which auto-sync)

### 3.4 Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3.5 Seed Data Login Notes

The seed script creates Prisma records only. Sync them to Clerk:

```bash
npm run sync-clerk
```

Default dev password: `CsolveSmsDev2026xR9k` (set `SYNC_DEFAULT_PASSWORD` in `.env`; avoid `#` in unquoted values — it is treated as a comment).

Sign in with **email** (recommended): `admin1@csolve-sms.dev` — or **username** `admin1` if enabled in Clerk Dashboard → User & Authentication → Username.

---

## 4. Docker Deployment (Local Full Stack)

### 4.1 Fixed Docker Compose

The current `docker-compose.yml` has known issues. Use this corrected version:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: school_postgres
    environment:
      POSTGRES_USER: school
      POSTGRES_PASSWORD: schoolpass
      POSTGRES_DB: school_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U school -d school_db']
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: school_app
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://school:schoolpass@postgres:5432/school_db?schema=public
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
```

### 4.2 Fixed Dockerfile (Production)

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

> **Note:** Enable `output: 'standalone'` in `next.config.mjs` for the production Dockerfile above.

### 4.3 Run with Docker Compose

```bash
# Set Clerk keys in .env, then:
docker compose up --build

# Run migrations (first time or after schema changes):
docker compose exec app npx prisma migrate deploy
```

---

## 5. Production Deployment

### 5.1 Recommended: Vercel + Managed PostgreSQL

**Stack:**
- **Hosting:** Vercel (Next.js native)
- **Database:** Neon, Supabase, or Railway PostgreSQL
- **Auth:** Clerk (production instance)
- **Media:** Cloudinary or AWS S3
- **Monitoring:** Sentry

**Steps:**

1. **Database**
   - Create PostgreSQL instance on Neon/Supabase
   - Copy connection string to `DATABASE_URL`
   - Enable connection pooling (PgBouncer) for serverless

2. **Clerk**
   - Create production Clerk application
   - Configure session token customization (see §3.3)
   - Set production domain in Clerk allowed origins

3. **Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```
   - Connect GitHub repository
   - Add all environment variables in Vercel dashboard
   - Set build command: `npx prisma generate && npm run build`
   - Add post-deploy migration: use Vercel deploy hook or CI step:
     ```bash
     npx prisma migrate deploy
     ```

4. **Prisma on Vercel**
   Add to `package.json`:
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate",
       "build": "prisma generate && next build"
     }
   }
   ```

5. **Domain & SSL**
   - Vercel provides automatic SSL
   - Configure custom domain in Vercel + Clerk

### 5.2 Alternative: VPS / Self-Hosted

For schools requiring on-premise deployment:

```bash
# On Ubuntu 22.04+ VPS
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot

# Clone repo, configure .env
git clone <repo> /opt/school-app
cd /opt/school-app

# Use fixed docker-compose from §4.1
docker compose up --build -d

# Nginx reverse proxy
sudo certbot --nginx -d school.example.com
```

**Nginx config snippet:**
```nginx
server {
    listen 443 ssl;
    server_name school.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Database Management

### Migrations

```bash
# Development — create and apply migration
npx prisma migrate dev --name describe_change

# Production — apply pending migrations only
npx prisma migrate deploy

# Reset database (DEV ONLY — destroys all data)
npx prisma migrate reset
```

### Seed

```bash
npx prisma db seed
```

**Never run seed in production.**

### Backup

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20260705.sql
```

**Production:** Configure automated daily backups via your database provider (Neon/Supabase/RDS all offer this).

### Prisma Studio (Dev UI)

```bash
npx prisma studio
# Opens http://localhost:5555
```

---

## 7. CI/CD Pipeline

### GitHub Actions (Recommended)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/test_db?schema=public

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npx prisma migrate deploy

      - run: npm run lint

      - run: npm run build
        env:
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_placeholder
          CLERK_SECRET_KEY: sk_test_placeholder
```

---

## 8. Environment Checklist

### Development
- [ ] `.env` configured with local DATABASE_URL
- [ ] Clerk dev keys set
- [ ] Clerk session token customized with role metadata
- [ ] Migrations applied
- [ ] Seed data loaded (optional)
- [ ] `npm run dev` starts without errors

### Staging
- [ ] Separate Clerk application (staging)
- [ ] Staging database (not production)
- [ ] All env vars in hosting platform
- [ ] Migrations run via CI/CD
- [ ] Smoke test: login as each role

### Production
- [ ] Production Clerk application
- [ ] Production database with backups enabled
- [ ] Connection pooling configured
- [ ] All secrets in secret manager (not in code)
- [ ] SSL/TLS enabled
- [ ] Sentry or error monitoring connected
- [ ] `prisma migrate deploy` in deploy pipeline
- [ ] Seed NOT run
- [ ] Domain configured in Clerk allowed origins
- [ ] Cloudinary/S3 production bucket

---

## 9. Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Middleware redirect loop | Role undefined in session | Configure Clerk JWT session token (§3.3) |
| RBAC not working | `metadata.role` vs `publicMetadata.role` mismatch | Unify on sessionClaims.metadata via JWT template |
| Prisma connection error | Wrong DATABASE_URL | Verify connection string, DB running |
| Clerk user can't login | User not in Clerk | Create via Clerk dashboard or CRUD form |
| Photo upload fails | Missing Cloudinary env vars | Set all three Cloudinary variables |
| Build fails on Vercel | Prisma client not generated | Add `prisma generate` to build script |
| Docker app can't reach DB | Wrong service name / host | Use `postgres` hostname inside compose network |
| Stale data after mutation | `revalidatePath` commented out | Uncomment in server actions |
| Delete wrong entity | FormModal delete stubs | Implement correct delete actions (Phase 0) |

### Useful Commands

```bash
# Check Prisma schema vs database
npx prisma db pull

# View migration status
npx prisma migrate status

# Format schema
npx prisma format

# Next.js build locally (catch errors before deploy)
npm run build

# Lint
npm run lint
```

---

## 10. Security Checklist (Pre-Production)

- [ ] `auth().protect()` enabled on all protected routes
- [ ] Server actions validate auth + permissions
- [ ] Server-side Zod validation on all inputs
- [ ] No secrets in git (verify with `git log -- .env`)
- [ ] Clerk production keys (not test keys)
- [ ] HTTPS enforced
- [ ] Database credentials rotated from defaults
- [ ] Rate limiting on API routes (Phase 3)
- [ ] Audit logging enabled (Phase 3)
- [ ] Regular dependency updates (`npm audit`)

---

## 11. Scaling Considerations

| Users | Recommendation |
|-------|----------------|
| < 500 | Vercel + Neon free/starter tier |
| 500–5,000 | Vercel Pro + Neon scale + Redis cache |
| 5,000+ | Dedicated PostgreSQL (RDS) + PgBouncer + Redis + CDN |
| Multi-school | Phase 6 multi-tenancy + row-level isolation |

Monitor: response times, database connections, error rates, and storage usage as enrollment grows.
