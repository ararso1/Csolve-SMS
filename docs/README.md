# Csolve SMS — Documentation

Enterprise-grade documentation for **Csolve SMS**, the School Management System developed by **Csolve Technologies**.

## Document Index

| Document | Description |
|----------|-------------|
| [01 — Project Analysis](./01-PROJECT-ANALYSIS.md) | Current state audit, feature inventory, gaps, quality review |
| [02 — System Architecture](./02-SYSTEM-ARCHITECTURE.md) | Architecture diagrams, data flow, tech stack, security model |
| [03 — Module Documentation](./03-MODULE-DOCUMENTATION.md) | Per-module specs, routes, entities, and API surface |
| [04 — Development Roadmap](./04-DEVELOPMENT-ROADMAP.md) | Phased plan, priorities, milestones, deliverables |
| [05 — Deployment Guide](./05-DEPLOYMENT-GUIDE.md) | Local, Docker, and production deployment instructions |

## Quick Summary

**Product:** Csolve SMS — School Management System by Csolve Technologies

**Current state:** Next.js 14 monolith with PostgreSQL, Prisma ORM, Clerk authentication, shadcn/ui design system, and full CRUD for all core entities.

**Target state:** A secure, scalable, multi-tenant School Management System supporting kindergarten through secondary/preparatory levels with full RBAC, reporting, notifications, and integrations.

**Upgrade path:** 6 phases over ~6–9 months (see [Roadmap](./04-DEVELOPMENT-ROADMAP.md)).

## Roles Supported

| Role | Dashboard | Primary Capabilities |
|------|-----------|---------------------|
| Admin | `/admin` | Full CRUD, analytics, events, attendance |
| Teacher | `/teacher` | Schedule, exams, assignments, attendance |
| Student | `/student` | Schedule, view grades/assignments |
| Parent | `/parent` | Child schedules, announcements |

## Tech Stack

- **Frontend:** Next.js 14 App Router, React 18, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Server Actions + Server Components (no REST API)
- **Database:** PostgreSQL 15 + Prisma 5
- **Auth:** Clerk
- **File Storage:** Cloudinary (teacher/student photos)

---

*Csolve Technologies — July 2026*
