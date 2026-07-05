# 02 — System Architecture

## 1. Architecture Overview

### 1.1 Current Architecture (As-Is)

The application is a **monolithic Next.js 14 full-stack app** using the App Router pattern. There is no separate backend service or REST API layer.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  React Client Components: Forms, Modals, Charts, Pagination     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (RSC stream + Server Actions)
┌────────────────────────────▼────────────────────────────────────┐
│                    NEXT.JS 14 APP ROUTER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Middleware  │  │ Server       │  │ Server Actions       │  │
│  │  (Clerk RBAC)│  │ Components   │  │ (src/lib/actions.ts) │  │
│  └──────────────┘  │ (Prisma read)│  └──────────────────────┘  │
│                    └──────────────┘                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌───────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │    Clerk      │ │   Cloudinary    │
│   (Prisma ORM)  │ │   (Auth)      │ │   (Images)      │
└─────────────────┘ └───────────────┘ └─────────────────┘
```

### 1.2 Target Architecture (To-Be)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│   Web App (Next.js)  │  Mobile App  │  Parent Portal PWA  │  Admin API   │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│                         EDGE / CDN (Vercel / Cloudflare)                 │
│                    WAF │ Rate Limiting │ SSL │ Static Assets             │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│                      NEXT.JS APPLICATION LAYER                           │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Middleware │  │ RSC Pages   │  │ Server       │  │ API Routes      │ │
│  │ Auth+RBAC  │  │ + Layouts   │  │ Actions      │  │ /api/v1/*       │ │
│  └────────────┘  └─────────────┘  └──────────────┘  └─────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                    SERVICE LAYER (lib/services/*)                   │ │
│  │  AuthService │ StudentService │ AttendanceService │ ReportService   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┬──────────────────┐
         ▼                     ▼                     ▼                  ▼
┌─────────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│   PostgreSQL    │  │     Redis     │  │  Clerk/Auth  │  │  S3/R2       │
│   + PgBouncer   │  │  Cache/Queue  │  │  + RBAC      │  │  Files       │
└─────────────────┘  └───────────────┘  └──────────────┘  └──────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND WORKERS (Optional Phase 5+)                │
│         Email │ SMS │ Report Generation │ Data Import/Export             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Application Layers

### 2.1 Presentation Layer

| Component | Location | Responsibility |
|-----------|----------|----------------|
| Pages | `src/app/**/page.tsx` | Route handlers, data fetching, layout composition |
| Layouts | `src/app/**/layout.tsx` | Shared chrome (sidebar, navbar) |
| Components | `src/components/**` | Reusable UI (tables, charts, forms, modals) |
| Forms | `src/components/forms/**` | Entity-specific create/update forms |
| Styles | `tailwind.config.ts`, `globals.css` | Theming and overrides |

**Pattern:** Server Components fetch data via Prisma; Client Components handle interactivity.

### 2.2 Application / Business Layer

| Component | Location | Responsibility |
|-----------|----------|----------------|
| Server Actions | `src/lib/actions.ts` | Mutations (create, update, delete) |
| Validation | `src/lib/formValidationSchemas.ts` | Zod schemas (client-side today) |
| Settings | `src/lib/settings.ts` | Pagination, route access map |
| Utils | `src/lib/utils.ts` | Calendar date helpers |

**Gap:** No dedicated service layer. Business rules are embedded in actions and page components.

### 2.3 Data Access Layer

| Component | Location | Responsibility |
|-----------|----------|----------------|
| Prisma Client | `src/lib/prisma.ts` | Singleton database client |
| Schema | `prisma/schema.prisma` | Entity definitions |
| Migrations | `prisma/migrations/**` | Schema versioning |
| Seed | `prisma/seed.ts` | Development sample data |

### 2.4 Cross-Cutting Concerns

| Concern | Implementation | Status |
|---------|----------------|--------|
| Authentication | Clerk (`ClerkProvider`, middleware) | Partial |
| Authorization | Middleware route map + page-level checks | Incomplete |
| Validation | Zod (client only) | Needs server-side |
| Error handling | try/catch → boolean | Needs improvement |
| Logging | console.log | Needs structured logging |
| Caching | None | Needs revalidation + Redis |
| i18n | None | Planned |

---

## 3. Authentication & Authorization Flow

### 3.1 Sign-In Flow

```
User → / (sign-in page)
     → Clerk validates credentials
     → Client reads user.publicMetadata.role
     → router.push(`/${role}`)  →  /admin | /teacher | /student | /parent
```

### 3.2 Request Authorization Flow

```
HTTP Request
     → middleware.ts (clerkMiddleware)
     → Extract sessionClaims.metadata.role
     → Match route against routeAccessMap
     → If role NOT in allowedRoles → redirect to /{role}
     → Else → continue to page
     → Page-level: hide/show UI based on role
     → Server Action: (currently NO CHECK) → Prisma mutation
```

### 3.3 Required Clerk Configuration

For middleware RBAC to work, configure Clerk **JWT session token** to include role:

```json
{
  "metadata": {
    "role": "{{user.public_metadata.role}}"
  }
}
```

Path: Clerk Dashboard → Sessions → Customize session token

### 3.4 Target RBAC Model

```
User ──► Role ──► Permissions[] ──► Resource + Action

Examples:
  admin     → *:* (all)
  teacher   → exam:create, exam:update (own lessons), attendance:mark
  student   → result:read (own), assignment:read (own)
  parent    → student:read (children), attendance:read (children)
  registrar → student:*, parent:*, class:*
  accountant  → fee:*, payment:*
```

Implement via:
- `src/lib/permissions.ts` — permission constants and helpers
- `requirePermission(action, resource)` — called at top of every server action
- Database-driven roles (Phase 4+) for custom school configurations

---

## 4. Data Architecture

### 4.1 Entity Relationship Diagram

```
Admin (standalone)

Parent ──1:N──► Student ──N:1──► Class ──N:1──► Grade
                  │                │
                  │                ├──1:N──► Event
                  │                ├──1:N──► Announcement
                  │                └──1:1──► Teacher (supervisor)
                  │
                  ├──N:1──► Parent
                  ├──1:N──► Attendance
                  └──1:N──► Result

Teacher ──M:N──► Subject
   │
   └──1:N──► Lesson ──N:1──► Subject
              │              Class
              │              Teacher
              ├──1:N──► Exam ──1:N──► Result
              ├──1:N──► Assignment ──1:N──► Result
              └──1:N──► Attendance
```

### 4.2 Key Design Decisions

| Decision | Current | Recommended |
|----------|---------|-------------|
| Primary keys | String (Clerk ID) for users; Int for entities | Keep for users; consider UUID for entities |
| Soft delete | Hard delete | Add `deletedAt` + `deletedBy` |
| Multi-tenancy | None | Add `schoolId` to all tenant-scoped tables |
| Timestamps | `createdAt` on some models | Add `updatedAt`, `createdBy` everywhere |
| Result polymorphism | Optional examId OR assignmentId | DB check constraint: XOR required |

### 4.3 Planned Schema Extensions (Enterprise)

```prisma
model School {
  id        String   @id @default(cuid())
  name      String
  // ... address, logo, settings
  branches  Branch[]
}

model AcademicYear {
  id        String   @id
  name      String   // "2025-2026"
  startDate DateTime
  endDate   DateTime
  isCurrent Boolean
  terms     Term[]
}

model Fee {
  id          String
  studentId   String
  amount      Decimal
  dueDate     DateTime
  status      FeeStatus
  payments    Payment[]
}

model Message {
  id          String
  senderId    String
  recipientId String
  content     String
  readAt      DateTime?
}

model AuditLog {
  id         String
  userId     String
  action     String
  entity     String
  entityId   String
  metadata   Json
  createdAt  DateTime
}
```

---

## 5. Request & Data Flow Patterns

### 5.1 Read Flow (List Page)

```
Browser GET /list/students?page=2&search=john
  → middleware (auth check)
  → ExamListPage (Server Component)
  → auth() → role
  → prisma.student.findMany({ where, skip, take, include })
  → Render Table + Pagination + Search (client)
```

### 5.2 Write Flow (Create via Modal)

```
User clicks Create → FormModal opens → StudentForm (client)
  → react-hook-form + zodResolver validates
  → useFormState → createStudent server action
  → clerkClient.users.createUser()
  → prisma.student.create()
  → { success: true } → toast + router.refresh()
```

### 5.3 Target Write Flow (With Auth)

```
Server Action invoked
  → auth() — reject if unauthenticated
  → requirePermission('student:create')
  → server-side Zod parse
  → StudentService.create().create(data) — transaction
  → AuditLog.record()
  → revalidatePath('/list/students')
  → return { success, data, error? }
```

---

## 6. Technology Recommendations

### 6.1 Keep (Phase 1)

| Technology | Reason |
|------------|--------|
| Next.js App Router | Modern RSC pattern, good DX |
| TypeScript | Type safety across stack |
| Prisma | Excellent ORM, migrations |
| PostgreSQL | Robust, scalable RDBMS |
| Tailwind CSS | Rapid UI development |
| Zod | Runtime validation |
| React Hook Form | Performant forms |

### 6.2 Upgrade (Phase 2–3)

| From | To | Reason |
|------|-----|--------|
| Clerk only | Clerk + custom RBAC layer | Granular permissions |
| Server Actions only | + REST API (`/api/v1`) | Mobile, integrations |
| console.log | Pino / Winston | Structured logging |
| Moment.js | date-fns | Smaller bundle, immutable |
| Hand-built UI | shadcn/ui + Radix | Accessibility, consistency |
| react-toastify | Sonner | Better Next.js integration |

### 6.3 Add (Phase 3–5)

| Technology | Purpose |
|------------|---------|
| Redis (Upstash) | Caching, rate limits, sessions |
| BullMQ / Inngest | Background jobs |
| Resend | Transactional email |
| S3 / Cloudflare R2 | Document storage |
| TanStack Query | Client cache for API routes |
| TanStack Table | Advanced data tables |
| Playwright | E2E testing |
| Vitest | Unit/integration tests |
| GitHub Actions | CI/CD |
| Sentry | Error monitoring |
| next-intl | Internationalization |

---

## 7. Security Architecture

### 7.1 Defense in Depth

```
Layer 1: CDN/WAF          — DDoS, bot protection
Layer 2: Middleware        — Auth required, RBAC route guard
Layer 3: Server Actions    — Permission check + input validation
Layer 4: Service Layer     — Business rule enforcement
Layer 5: Database          — Row-level security (optional), FK constraints
Layer 6: Audit             — Immutable action log
```

### 7.2 Data Protection

- Encrypt `DATABASE_URL` and secrets via environment variables / secret manager
- HTTPS only in production
- Clerk handles password hashing
- PII fields: consider encryption at rest for sensitive health/financial data
- GDPR/FERPA: data export and deletion endpoints (Phase 4)

---

## 8. Deployment Architecture

### 8.1 Recommended Production Stack

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Vercel    │────►│  PostgreSQL  │     │  Upstash Redis  │
│  (Next.js)  │     │  (Neon/Supabase/RDS) │             │
└─────────────┘     └──────────────┘     └─────────────────┘
       │
       ├──► Clerk (auth)
       ├──► Cloudinary/S3 (media)
       ├──► Resend (email)
       └──► Sentry (monitoring)
```

### 8.2 Environment Separation

| Environment | Purpose | Database |
|-------------|---------|----------|
| development | Local dev | Local Postgres / Docker |
| staging | QA, demos | Staging DB (seeded) |
| production | Live schools | Production DB (no seed) |

---

## 9. Folder Structure (Target)

```
src/
├── app/
│   ├── (auth)/              # Sign-in, sign-up, forgot password
│   ├── (dashboard)/         # Role dashboards + list pages
│   ├── api/v1/              # REST API (Phase 3)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                  # shadcn primitives
│   ├── forms/
│   ├── charts/
│   └── layout/
├── lib/
│   ├── actions/             # Split by entity
│   ├── services/            # Business logic
│   ├── permissions.ts
│   ├── auth.ts
│   ├── prisma.ts
│   └── validations/
├── hooks/
├── types/
└── middleware.ts
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
docs/                        # This documentation set
tests/
├── unit/
├── integration/
└── e2e/
```

---

## 10. Integration Points

| System | Integration Type | Phase |
|--------|-----------------|-------|
| Clerk | Auth provider | Current |
| Cloudinary | Image CDN | Current |
| Google OAuth | SSO | Phase 3 |
| Stripe | Fee payments | Phase 4 |
| Twilio | SMS alerts | Phase 4 |
| Resend | Email | Phase 3 |
| Webhooks | Outbound events | Phase 4 |
| REST API | Mobile apps | Phase 3 |
