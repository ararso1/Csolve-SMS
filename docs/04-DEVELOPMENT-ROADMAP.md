# 04 — Development Roadmap

## Overview

This roadmap transforms **Csolve SMS** (developed by **Csolve Technologies**) into an **enterprise-grade School Management System** suitable for real-world deployment across kindergarten through secondary/preparatory levels.

**Estimated timeline:** 6–9 months (1–2 developers)  
**Approach:** Fix foundations first, then complete features, then add enterprise modules

---

## Phase Summary

| Phase | Name | Duration | Priority | Goal |
|-------|------|----------|----------|------|
| 0 | Foundation & Stabilization | 2–3 weeks | P0 | Fix bugs, security, devops basics |
| 1 | Core CRUD Completion | 3–4 weeks | P0 | All entities fully functional |
| 2 | UX & UI Modernization | 3–4 weeks | P1 | Professional, accessible interface |
| 3 | Security, RBAC & API | 4–5 weeks | P0 | Production-grade auth + REST API |
| 4 | Academic & Operations | 5–6 weeks | P1 | Terms, grading, fees, admissions |
| 5 | Communication & Automation | 3–4 weeks | P1 | Notifications, messaging, reports |
| 6 | Enterprise & Scale | 4–6 weeks | P2 | Multi-tenancy, analytics, integrations |

---

## Phase 0: Foundation & Stabilization

**Duration:** 2–3 weeks  
**Priority:** P0 — Blocker for everything else

### Objectives
Establish a stable, secure baseline before adding features.

### Milestones

| # | Milestone | Deliverable |
|---|-----------|-------------|
| 0.1 | Environment setup | `.env.example`, updated README, working local dev |
| 0.2 | Critical bug fixes | All known bugs from analysis resolved |
| 0.3 | Auth hardening | Clerk JWT config, `auth().protect()` enabled |
| 0.4 | Docker fix | Working `docker-compose.yml` and production Dockerfile |
| 0.5 | CI baseline | GitHub Actions: lint, typecheck, build |

### Tasks

#### 0.1 Project Setup
- [x] Create `.env.example` with all required variables:
  ```
  DATABASE_URL=
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
  CLERK_SECRET_KEY=
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  ```
- [x] Update root README with project overview and doc links
- [x] Add `npm run db:seed`, `npm run db:migrate`, `npm run db:reset` scripts
- [x] Remove or archive unused `src/lib/data.ts` mock data

#### 0.2 Critical Bug Fixes
- [x] Fix `FormModal` delete stubs — implement correct delete actions per entity
- [x] Fix delete form hidden input: `type="hidden"`
- [x] Remove `password` from Prisma update payloads in teacher/student actions
- [x] Fix assignments create button JSX bug
- [x] Fix results page name display (`name + surname`)
- [x] Fix student dashboard null class crash
- [x] Fix student dashboard hardcoded schedule title
- [x] Uncomment and fix `revalidatePath()` in all server actions
- [x] Remove `console.log` from middleware, actions, pages

#### 0.3 Authentication Hardening
- [x] Configure Clerk session token: `{ "metadata": { "role": "{{user.public_metadata.role}}" } }` (documented in `.env.example`)
- [x] Enable `auth().protect()` for all dashboard routes
- [x] Add `/list/lessons` to `routeAccessMap`
- [x] Add detail page routes to `routeAccessMap`
- [x] Fix Home menu link → `/${role}` dashboard
- [x] Replace `/logout` menu link with Clerk signOut action

#### 0.4 DevOps
- [x] Fix docker-compose: service name, env syntax, internal networking
- [x] Replace `prisma migrate dev` with `prisma migrate deploy` in Dockerfile
- [x] Add health check endpoints
- [x] GitHub Actions workflow: lint + build on PR

### Phase 0 Deliverables
- ✅ App runs locally with documented setup
- ✅ No critical bugs in existing CRUD flows
- ✅ Auth middleware fully functional
- ✅ Docker compose works for local development
- ✅ CI pipeline green

---

## Phase 1: Core CRUD Completion

**Duration:** 3–4 weeks  
**Priority:** P0

### Objectives
Every entity advertised in the UI has working create, read, update, delete operations.

### Milestones

| # | Milestone | Deliverable |
|---|-----------|-------------|
| 1.1 | Missing server actions | 7 new entity action sets |
| 1.2 | Missing forms | 7 new form components |
| 1.3 | Attendance module | Full attendance page + bulk marking |
| 1.4 | Server validation | Zod validation in all server actions |
| 1.5 | Auth in actions | Role checks in every server action |

### Tasks

#### 1.1 Server Actions (split `actions.ts` into `lib/actions/*.ts`)
- [x] `parent.actions.ts` — create/update/delete + Clerk provisioning
- [x] `lesson.actions.ts` — CRUD with conflict detection
- [x] `assignment.actions.ts` — CRUD
- [x] `result.actions.ts` — CRUD with exam/assignment XOR validation
- [x] `attendance.actions.ts` — CRUD + bulk create
- [x] `event.actions.ts` — CRUD
- [x] `announcement.actions.ts` — CRUD

#### 1.2 Forms
- [x] `ParentForm.tsx`
- [x] `LessonForm.tsx` — day/time pickers, subject/class/teacher selects
- [x] `AssignmentForm.tsx`
- [x] `ResultForm.tsx` — student + exam OR assignment select
- [x] `AttendanceForm.tsx`
- [x] `EventForm.tsx`
- [x] `AnnouncementForm.tsx`

#### 1.3 Attendance Module
- [x] Create `/list/attendance/page.tsx`
- [x] Teacher view: select class + date → mark all students present/absent
- [x] Admin view: filter by class, date range, export CSV
- [x] Student/parent view: read-only attendance history

#### 1.4 Validation & Auth Layer
- [x] Create `src/lib/auth.ts` — `requireAuth()`, `requireRole()`, `requirePermission()`
- [x] Add Zod schemas for all entities
- [x] Server-side parse in every action
- [x] Return structured errors: `{ success, error?, message?, fieldErrors? }`

#### 1.5 Admin User Management
- [x] Admin creation flow with Clerk sync
- [x] Script to sync seed users to Clerk (dev only)

### Phase 1 Deliverables
- ✅ 100% CRUD coverage for all 12 entity types
- ✅ Attendance page functional
- ✅ Server-side validation on all mutations
- ✅ Authorization enforced in server actions

---

## Phase 2: UX & UI Modernization

**Duration:** 3–4 weeks  
**Priority:** P1

### Objectives
Transform the tutorial UI into a professional, accessible, responsive interface.

### Milestones

| # | Milestone | Deliverable |
|---|-----------|-------------|
| 2.1 | Design system | shadcn/ui integrated, consistent components |
| 2.2 | Navigation | Active states, breadcrumbs, mobile drawer |
| 2.3 | Data tables | Sortable, filterable tables |
| 2.4 | Dashboards | Real data only, role-specific widgets |
| 2.5 | Accessibility | WCAG 2.1 AA baseline |

### Tasks

#### 2.1 Design System Setup
- [x] Install shadcn/ui + Radix primitives
- [x] Define design tokens (colors, typography, spacing)
- [x] Replace bespoke buttons, inputs, modals with shadcn components
- [x] Replace PNG icons with Lucide React
- [x] Add dark mode support

#### 2.2 Navigation & Layout
- [x] Mobile sidebar drawer with hamburger toggle
- [x] Active route highlighting in Menu
- [x] Breadcrumb component on all pages
- [x] Profile and Settings pages (basic: view/edit own profile)
- [x] Remove broken menu items or implement them

#### 2.3 Enhanced List Pages
- [x] Integrate TanStack Table for sort/filter/column visibility
- [x] Wire filter and sort toolbar buttons
- [x] Global search in Navbar (debounced, searches current entity or global)
- [x] Empty states with illustrations
- [x] Loading skeletons on all pages (not just `/list`)

#### 2.4 Dashboard Improvements
- [x] Replace FinanceChart with real fee data (placeholder until Phase 4) or remove
- [x] Replace Performance chart with calculated GPA/ average
- [x] Role-specific quick actions on dashboards
- [x] Notification center component (replace fake badge)

#### 2.5 Accessibility & Polish
- [x] aria labels on all interactive elements
- [x] Keyboard navigation for modals (Escape, focus trap)
- [x] Meaningful alt text on images
- [x] Form error association (`aria-describedby`)
- [x] Add `error.tsx` and `not-found.tsx` boundaries
- [x] Toast improvements with error messages from server

### Phase 2 Deliverables
- ✅ Modern UI with shadcn/ui design system
- ✅ Mobile-responsive with drawer navigation
- ✅ Functional search, sort, filter on list pages
- ✅ WCAG 2.1 AA baseline compliance
- ✅ Profile and Settings pages

---

## Phase 3: Security, RBAC & API Layer

**Duration:** 4–5 weeks  
**Priority:** P0

### Objectives
Production-grade security with granular permissions and external API access.

### Milestones

| # | Milestone | Deliverable |
|---|-----------|-------------|
| 3.1 | Permission system | Granular RBAC beyond 4 roles |
| 3.2 | REST API | Versioned `/api/v1` endpoints |
| 3.3 | Audit logging | All mutations logged |
| 3.4 | Testing | Unit + integration test suite |
| 3.5 | Monitoring | Error tracking + logging |

### Tasks

#### 3.1 Advanced RBAC
- [ ] Define permission matrix (resource × action × role)
- [ ] `Permission` enum and `hasPermission(user, permission)` helper
- [ ] Optional: database-driven roles for custom school configs
- [ ] Admin UI to view (and later edit) role permissions
- [ ] Re-enable teacher exam scoping with permission checks

#### 3.2 REST API (`/api/v1`)
- [ ] API route structure with consistent response format
- [ ] Clerk JWT verification middleware for API routes
- [ ] Endpoints for all entities (CRUD + list with pagination)
- [ ] OpenAPI/Swagger documentation
- [ ] Rate limiting (Upstash Redis)

#### 3.3 Audit & Security
- [ ] `AuditLog` model and service
- [ ] Log all create/update/delete with userId, timestamp, changes
- [ ] Input sanitization for text fields
- [ ] CSRF protection verification
- [ ] Security headers middleware

#### 3.4 Testing
- [ ] Vitest for unit tests (services, permissions, validation)
- [ ] Integration tests for server actions with test database
- [ ] Playwright E2E for critical flows (login, CRUD, RBAC)
- [ ] Target: 70%+ coverage on business logic

#### 3.5 Observability
- [ ] Structured logging with Pino
- [ ] Sentry error tracking
- [ ] Health check endpoint (`/api/health`)

### Phase 3 Deliverables
- ✅ Granular RBAC enforced everywhere
- ✅ Documented REST API v1
- ✅ Audit trail for all mutations
- ✅ Test suite with CI integration
- ✅ Production monitoring

---

## Phase 4: Academic & Operations Modules

**Duration:** 5–6 weeks  
**Priority:** P1

### Objectives
Add modules required for real school operations: academic structure, fees, admissions, report cards.

### Milestones

| # | Milestone | Deliverable |
|---|-----------|-------------|
| 4.1 | Academic structure | Terms, sessions, holidays |
| 4.2 | Grading system | Grade scales, GPA, report cards |
| 4.3 | Fee management | Invoices, payments, receipts |
| 4.4 | Admissions | Application workflow |
| 4.5 | Reports | PDF report cards, attendance reports |

### Tasks

#### 4.1 Academic Structure
- [ ] Schema: `AcademicYear`, `Term`, `Holiday`
- [ ] Admin UI to configure school calendar
- [ ] Scope exams, assignments, attendance to current term
- [ ] Auto-archive previous year data

#### 4.2 Grading System
- [ ] Schema: `GradingScale`, `GradeLevel` (A/B/C or 1–100)
- [ ] Result model extension: letter grade, comments, termId
- [ ] Teacher grade entry UI (bulk entry per class)
- [ ] Report card generation (PDF via `@react-pdf/renderer` or Puppeteer)
- [ ] Student/parent grade view with term filtering

#### 4.3 Fee Management
- [ ] Schema: `FeeCategory`, `Fee`, `Payment`, `Receipt`
- [ ] Admin: define fee structures per grade/class
- [ ] Generate invoices per student per term
- [ ] Payment recording (manual + Stripe integration hook)
- [ ] Replace FinanceChart with real revenue data
- [ ] Fee reminder emails (Phase 5)

#### 4.4 Admissions
- [ ] Schema: `Application`, `ApplicationStatus`
- [ ] Public application form (or admin-only entry)
- [ ] Workflow: submitted → review → accepted → enrolled
- [ ] On acceptance: auto-create student + parent records

#### 4.5 Reporting
- [ ] Attendance report by class/date range (PDF/CSV)
- [ ] Grade report by class/term (PDF/CSV)
- [ ] Enrollment statistics dashboard
- [ ] Custom date range picker for all reports

### Phase 4 Deliverables
- ✅ Full academic year management
- ✅ Grading and report cards
- ✅ Fee invoicing and payment tracking
- ✅ Admissions workflow
- ✅ Exportable reports

---

## Phase 5: Communication & Automation

**Duration:** 3–4 weeks  
**Priority:** P1

### Objectives
Enable school-wide communication, notifications, and automated workflows.

### Milestones

| # | Milestone | Deliverable |
|---|-----------|-------------|
| 5.1 | Messaging | In-app messaging system |
| 5.2 | Notifications | Email + in-app notification center |
| 5.3 | Automation | Scheduled jobs and triggers |
| 5.4 | SMS | Optional SMS alerts |

### Tasks

#### 5.1 Messaging Module
- [ ] Schema: `Conversation`, `Message`, `UserConversation`
- [ ] `/list/messages` page with inbox/sent/compose
- [ ] Real-time updates (polling or WebSocket/SSE)
- [ ] Admin can message teachers/parents; teachers message parents

#### 5.2 Notification System
- [ ] Schema: `Notification` (userId, type, title, body, readAt)
- [ ] Notification center dropdown in Navbar
- [ ] Email via Resend: announcements, grade posted, fee due, absence alert
- [ ] User notification preferences in Settings

#### 5.3 Automation
- [ ] Background job runner (Inngest or BullMQ)
- [ ] Triggers:
  - Absence → notify parent after N consecutive days
  - Fee due → reminder 7 days before, day of, 7 days after
  - Grade posted → notify student/parent
  - Weekly attendance summary to admin
- [ ] Scheduled report generation

#### 5.4 SMS (Optional)
- [ ] Twilio integration for urgent alerts
- [ ] Opt-in per parent

### Phase 5 Deliverables
- ✅ Working messaging module
- ✅ Email notifications for key events
- ✅ In-app notification center
- ✅ Automated alerts and reminders

---

## Phase 6: Enterprise & Scale

**Duration:** 4–6 weeks  
**Priority:** P2

### Objectives
Multi-school support, advanced analytics, integrations, and production hardening.

### Milestones

| # | Milestone | Deliverable |
|---|-----------|-------------|
| 6.1 | Multi-tenancy | School/branch isolation |
| 6.2 | Analytics | Advanced dashboards |
| 6.3 | Integrations | SSO, LMS, webhooks |
| 6.4 | Additional modules | Library, transport, HR |
| 6.5 | i18n | Multi-language support |

### Tasks

#### 6.1 Multi-Tenancy
- [ ] Schema: `School`, `Branch` with `schoolId` on all entities
- [ ] Tenant context middleware
- [ ] Super-admin portal for managing schools
- [ ] Data isolation verified by tests

#### 6.2 Advanced Analytics
- [ ] Enrollment trends over time
- [ ] Attendance heatmaps
- [ ] Grade distribution analytics
- [ ] Teacher workload dashboard
- [ ] Custom dashboard builder (drag-and-drop widgets)

#### 6.3 Integrations
- [ ] Google/Microsoft SSO via Clerk
- [ ] Webhook system for external consumers
- [ ] Google Calendar sync for events/exams
- [ ] Stripe full integration for online payments
- [ ] Data import/export (CSV bulk upload students/teachers)

#### 6.4 Additional Modules (Pick by Priority)
- [ ] **Library** — books, lending, fines
- [ ] **Transport** — routes, stops, student assignments
- [ ] **HR & Payroll** — staff records, leave management
- [ ] **Health Records** — medical info, allergies
- [ ] **Discipline** — incident tracking
- [ ] **Inventory** — asset management

#### 6.5 Internationalization
- [ ] next-intl setup
- [ ] Extract all UI strings
- [ ] Support English + 1 local language minimum
- [ ] RTL layout support (optional)

#### 6.6 Production Hardening
- [ ] Load testing (k6 or Artillery)
- [ ] Database connection pooling (PgBouncer)
- [ ] CDN for static assets
- [ ] Backup and disaster recovery plan
- [ ] GDPR/FERPA compliance: data export, deletion requests

### Phase 6 Deliverables
- ✅ Multi-school deployment ready
- ✅ Integration ecosystem
- ✅ Advanced analytics
- ✅ Production hardened and load tested

---

## Implementation Priority Matrix

```
                    IMPACT
                High │ Phase 0    Phase 1    Phase 3
                     │ (bugs)     (CRUD)     (security)
                     │
                     │ Phase 4    Phase 5    Phase 6
                Low  │ (academic) (comms)    (enterprise)
                     └──────────────────────────────
                       Low          EFFORT         High
```

**Recommended execution order:** 0 → 1 → 3 → 2 → 4 → 5 → 6

Phase 3 (security) before Phase 2 (UI) ensures new UI components are built on secure foundations. Phases 2 and 3 can partially overlap if team capacity allows.

---

## Success Criteria (Production Ready)

| Criteria | Target |
|----------|--------|
| CRUD coverage | 100% of core entities |
| Authorization | Every route and action protected |
| Test coverage | ≥ 70% business logic |
| Accessibility | WCAG 2.1 AA |
| Uptime SLA | 99.9% |
| Page load (LCP) | < 2.5s |
| Security audit | No critical/high findings |
| Documentation | Complete and current |
| Mobile usable | All flows on 375px viewport |
| Data backup | Daily automated backups |

---

## Next Steps

Upon approval of this roadmap, **Phase 0 implementation begins immediately** with:

1. `.env.example` and README update
2. Critical bug fixes in `FormModal`, server actions, and pages
3. Clerk JWT session token configuration
4. Docker compose repair
5. GitHub Actions CI workflow

See [05 — Deployment Guide](./05-DEPLOYMENT-GUIDE.md) for environment setup instructions.
