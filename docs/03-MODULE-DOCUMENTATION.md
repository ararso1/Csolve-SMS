# 03 — Module Documentation

## 1. Module Overview

| # | Module | Route(s) | Roles | CRUD Status |
|---|--------|----------|-------|-------------|
| 1 | Authentication | `/` | Public | N/A |
| 2 | Admin Dashboard | `/admin` | admin | N/A |
| 3 | Teacher Dashboard | `/teacher` | teacher | N/A |
| 4 | Student Dashboard | `/student` | student | N/A |
| 5 | Parent Dashboard | `/parent` | parent | N/A |
| 6 | Teachers | `/list/teachers`, `/list/teachers/[id]` | admin, teacher | ✅ Full |
| 7 | Students | `/list/students`, `/list/students/[id]` | admin, teacher | ✅ Full |
| 8 | Parents | `/list/parents` | admin, teacher | ❌ Read only |
| 9 | Subjects | `/list/subjects` | admin | ✅ Full |
| 10 | Classes | `/list/classes` | admin, teacher | ✅ Full |
| 11 | Lessons | `/list/lessons` | admin, teacher | ❌ Read only |
| 12 | Exams | `/list/exams` | all | ✅ Full |
| 13 | Assignments | `/list/assignments` | all | ❌ Read only |
| 14 | Results | `/list/results` | all | ❌ Read only |
| 15 | Attendance | `/list/attendance` | all | ❌ Missing page |
| 16 | Events | `/list/events` | all | ❌ Read only |
| 17 | Announcements | `/list/announcements` | all | ❌ Read only |
| 18 | Messages | `/list/messages` | all | ❌ Missing |
| 19 | Profile | `/profile` | all | ❌ Missing |
| 20 | Settings | `/settings` | all | ❌ Missing |

---

## 2. Authentication Module

### Routes
- `GET /` — Sign-in page (`src/app/[[...sign-in]]/page.tsx`)

### Dependencies
- `@clerk/nextjs`, `@clerk/elements`

### Behavior
1. Renders custom sign-in form (username/password)
2. On successful auth, reads `user.publicMetadata.role`
3. Redirects to role dashboard (`/admin`, `/teacher`, `/student`, `/parent`)

### Server Actions
None

### Known Issues
- No sign-up flow (users created by admin via teacher/student forms)
- Admin/parent roles require manual Clerk user creation with correct metadata
- No forgot-password UI (Clerk provides default if configured)

---

## 3. Dashboard Modules

### 3.1 Admin Dashboard (`/admin`)

**File:** `src/app/(dashboard)/admin/page.tsx`

**Components:**
| Component | Data Source | Description |
|-----------|-------------|-------------|
| `UserCard` × 4 | Prisma count | Admin, teacher, student, parent totals |
| `CountChartContainer` | Prisma | Male/female student ratio |
| `AttendanceChartContainer` | Prisma | Weekly present/absent bars |
| `FinanceChart` | **Static** | Income/expense line chart (placeholder) |
| `EventCalendarContainer` | Prisma | Date picker + events for selected date |
| `Announcements` | Prisma | Latest 3 announcements |

**Access:** admin only (middleware)

---

### 3.2 Teacher Dashboard (`/teacher`)

**File:** `src/app/(dashboard)/teacher/page.tsx`

**Components:**
- `BigCalendarContainer` — weekly lesson schedule for logged-in teacher
- `Announcements` — class-filtered announcements

**Access:** teacher only

---

### 3.3 Student Dashboard (`/student`)

**File:** `src/app/(dashboard)/student/page.tsx`

**Components:**
- `BigCalendarContainer` — class schedule
- `EventCalendar` — personal event calendar
- `Announcements` — class announcements

**Access:** student only

**Known Issues:**
- Hardcoded schedule title `"Schedule (4A)"`
- Potential crash if student has no class assignment

---

### 3.4 Parent Dashboard (`/parent`)

**File:** `src/app/(dashboard)/parent/page.tsx`

**Components:**
- `BigCalendarContainer` per child — schedules for each linked student
- `Announcements` — aggregated for children's classes

**Access:** parent only

---

## 4. Entity Modules

### 4.1 Teachers Module

**Routes:**
- `GET /list/teachers` — Paginated list with search
- `GET /list/teachers/[id]` — Profile with schedule

**Database Model:** `Teacher`

| Field | Type | Required |
|-------|------|----------|
| id | String (Clerk ID) | Yes |
| username | String | Yes, unique |
| name, surname | String | Yes |
| email, phone | String | Optional, unique |
| address | String | Yes |
| img | String | Optional |
| bloodType | String | Yes |
| sex | UserSex enum | Yes |
| birthday | DateTime | Yes |
| subjects | Subject[] | M2M |
| classes | Class[] | Supervisor relation |
| lessons | Lesson[] | 1:N |

**Server Actions:**
- `createTeacher` — Creates Clerk user + Prisma record
- `updateTeacher` — Updates both (password bug in Prisma update)
- `deleteTeacher` — Deletes Clerk user + Prisma record

**Validation:** `teacherSchema` in `formValidationSchemas.ts`

**Form:** `src/components/forms/TeacherForm.tsx`
- Cloudinary photo upload
- Multi-select subjects
- Password required on create, optional on update

**Role Permissions:**
| Action | admin | teacher | student | parent |
|--------|-------|---------|---------|--------|
| List | ✅ | ✅ | ❌ | ❌ |
| Create | ✅ | ❌ | ❌ | ❌ |
| Update | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| View detail | ✅ | ✅ | ❌ | ❌ |

---

### 4.2 Students Module

**Routes:**
- `GET /list/students` — Paginated list with search
- `GET /list/students/[id]` — Profile with schedule, attendance, performance

**Database Model:** `Student`

**Server Actions:** `createStudent`, `updateStudent`, `deleteStudent`

**Business Rules:**
- Class capacity check on create (returns error if full, no user message)
- Links to parent, class, grade

**Detail Page Components:**
- `BigCalendarContainer` — class schedule
- `StudentAttendanceCard` — YTD attendance percentage
- `Performance` — **placeholder** grade chart

**Role Permissions:**
| Action | admin | teacher | student | parent |
|--------|-------|---------|---------|--------|
| List | ✅ | ✅ | ❌ | ❌ |
| Create | ✅ | ❌ | ❌ | ❌ |
| Update | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| View own profile | — | — | ✅ (via dashboard) | ✅ (children) |

---

### 4.3 Parents Module

**Route:** `GET /list/parents`

**Database Model:** `Parent`

**Server Actions:** ❌ None implemented

**Form:** ❌ Not implemented (delete stub calls `deleteSubject`)

**Displays:** Name, contact info, linked students

**Needed Implementation:**
- `createParent`, `updateParent`, `deleteParent` actions
- `ParentForm.tsx` with student linking
- Clerk user provisioning with `role: "parent"`

---

### 4.4 Subjects Module

**Route:** `GET /list/subjects`

**Database Model:** `Subject` — id, name (unique), teachers[], lessons[]

**Server Actions:** `createSubject`, `updateSubject`, `deleteSubject`

**Form:** `SubjectForm.tsx` — name + teacher multi-select

**Access:** admin only

---

### 4.5 Classes Module

**Route:** `GET /list/classes`

**Database Model:** `Class`

| Field | Description |
|-------|-------------|
| name | Unique class name (e.g., "4A") |
| capacity | Max students |
| gradeId | FK to Grade |
| supervisorId | Optional FK to Teacher |

**Server Actions:** `createClass`, `updateClass`, `deleteClass`

**Form:** `ClassForm.tsx`

---

### 4.6 Lessons Module

**Route:** `GET /list/lessons`

**Database Model:** `Lesson`

| Field | Description |
|-------|-------------|
| name | Lesson title |
| day | Day enum (Mon–Fri) |
| startTime, endTime | DateTime |
| subjectId, classId, teacherId | FKs |

**Server Actions:** ❌ None

**Middleware:** ❌ Not in `routeAccessMap`

**Needed:** `LessonForm.tsx` with subject/class/teacher/day/time pickers

---

### 4.7 Exams Module

**Route:** `GET /list/exams`

**Database Model:** `Exam` — title, startTime, endTime, lessonId

**Server Actions:** `createExam`, `updateExam`, `deleteExam`

**Role-based data filtering:**
- **Admin:** All exams
- **Teacher:** Exams for own lessons only
- **Student:** Exams for own class lessons
- **Parent:** Exams for children's class lessons

**Form:** `ExamForm.tsx` — lesson dropdown (teacher-scoped for teachers)

**Known Issue:** Teacher authorization in server actions is commented out

---

### 4.8 Assignments Module

**Route:** `GET /list/assignments`

**Database Model:** `Assignment` — title, startDate, dueDate, lessonId

**Server Actions:** ❌ None

**Role-based read filtering:** Same pattern as exams

**Needed:** `AssignmentForm.tsx`, CRUD actions, file attachment support (future)

---

### 4.9 Results Module

**Route:** `GET /list/results`

**Database Model:** `Result`

| Field | Description |
|-------|-------------|
| score | Integer |
| studentId | FK to Student |
| examId | Optional FK to Exam |
| assignmentId | Optional FK to Assignment |

**Server Actions:** ❌ None

**Role-based filtering:**
- Admin/teacher: all or scoped results
- Student: own results only
- Parent: children's results

**Known Bug:** Displays duplicate student name instead of full name

---

### 4.10 Attendance Module

**Route:** `/list/attendance` — **404 (page missing)**

**Database Model:** `Attendance`

| Field | Description |
|-------|-------------|
| date | DateTime |
| present | Boolean |
| studentId | FK to Student |
| lessonId | FK to Lesson |

**Partial Implementation:**
- `StudentAttendanceCard` on student detail (read-only aggregate)
- `AttendanceChartContainer` on admin dashboard (weekly aggregate)

**Needed:**
- Attendance list page with date/class filters
- Bulk mark attendance UI for teachers
- `AttendanceForm.tsx` + CRUD actions
- Daily attendance report

---

### 4.11 Events Module

**Route:** `GET /list/events`

**Database Model:** `Event` — title, description, startTime, endTime, classId (optional)

**Server Actions:** ❌ None

**Related Components:**
- `EventCalendar`, `EventList`, `EventCalendarContainer`

---

### 4.12 Announcements Module

**Route:** `GET /list/announcements`

**Database Model:** `Announcement` — title, description, date, classId (optional)

**Server Actions:** ❌ None

**Widget:** `Announcements.tsx` — shows latest 3 on all dashboards, role/class filtered

---

### 4.13 Messages Module

**Route:** `/list/messages` — **404 (not implemented)**

**Database Model:** ❌ Does not exist in schema

**Planned Schema:**
```prisma
model Conversation {
  id        String    @id @default(cuid())
  participants UserConversation[]
  messages  Message[]
  updatedAt DateTime  @updatedAt
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  senderId       String
  content        String
  readAt         DateTime?
  createdAt      DateTime @default(now())
}
```

---

## 5. Shared Components

### 5.1 Layout Components

| Component | File | Type | Purpose |
|-----------|------|------|---------|
| Menu | `Menu.tsx` | Server | Role-filtered sidebar navigation |
| Navbar | `Navbar.tsx` | Server | Search bar (decorative), icons, UserButton |

### 5.2 CRUD Components

| Component | File | Type | Purpose |
|-----------|------|------|---------|
| Table | `Table.tsx` | Server | Generic HTML table |
| TableSearch | `TableSearch.tsx` | Client | URL-based search (`?search=`) |
| Pagination | `Pagination.tsx` | Client | URL-based pagination (`?page=`) |
| FormContainer | `FormContainer.tsx` | Server | Fetches related data, renders FormModal |
| FormModal | `FormModal.tsx` | Client | Modal overlay + lazy-loaded forms |
| InputField | `InputField.tsx` | Server | Labeled form input |

### 5.3 Chart Components

| Component | Data | Library |
|-----------|------|---------|
| CountChart | Live | Recharts |
| AttendanceChart | Live | Recharts |
| FinanceChart | Static | Recharts |
| Performance | Static | Recharts |

### 5.4 Calendar Components

| Component | Library | Purpose |
|-----------|---------|---------|
| BigCalender | react-big-calendar | Weekly lesson grid |
| EventCalendar | react-calendar | Monthly date picker |

---

## 6. Server Actions Reference

All actions in `src/lib/actions.ts` follow this signature:

```typescript
type CurrentState = { success: boolean; error: boolean };

export const actionName = async (
  currentState: CurrentState,
  data: SchemaType | FormData
) => { /* ... */ };
```

### Implemented Actions

| Action | Input Schema | Side Effects |
|--------|-------------|--------------|
| `createSubject` | SubjectSchema | prisma.subject.create |
| `updateSubject` | SubjectSchema | prisma.subject.update |
| `deleteSubject` | FormData (id) | prisma.subject.delete |
| `createClass` | ClassSchema | prisma.class.create |
| `updateClass` | ClassSchema | prisma.class.update |
| `deleteClass` | FormData (id) | prisma.class.delete |
| `createTeacher` | TeacherSchema | Clerk create + prisma.teacher.create |
| `updateTeacher` | TeacherSchema | Clerk update + prisma.teacher.update |
| `deleteTeacher` | FormData (id) | Clerk delete + prisma.teacher.delete |
| `createStudent` | StudentSchema | Capacity check + Clerk + prisma |
| `updateStudent` | StudentSchema | Clerk update + prisma.teacher.update |
| `deleteStudent` | FormData (id) | Clerk delete + prisma.student.delete |
| `createExam` | ExamSchema | prisma.exam.create |
| `updateExam` | ExamSchema | prisma.exam.update |
| `deleteExam` | FormData (id) | prisma.exam.delete |

### Actions To Implement

| Entity | Create | Update | Delete |
|--------|--------|--------|--------|
| Parent | `createParent` | `updateParent` | `deleteParent` |
| Lesson | `createLesson` | `updateLesson` | `deleteLesson` |
| Assignment | `createAssignment` | `updateAssignment` | `deleteAssignment` |
| Result | `createResult` | `updateResult` | `deleteResult` |
| Attendance | `createAttendance` | `updateAttendance` | `deleteAttendance` |
| Event | `createEvent` | `updateEvent` | `deleteEvent` |
| Announcement | `createAnnouncement` | `updateAnnouncement` | `deleteAnnouncement` |

---

## 7. Validation Schemas

**File:** `src/lib/formValidationSchemas.ts`

| Schema | Key Fields |
|--------|------------|
| `subjectSchema` | name, teachers[] |
| `classSchema` | name, capacity, gradeId, supervisorId? |
| `teacherSchema` | username, password?, name, surname, email?, phone?, address, img?, bloodType, birthday, sex, subjects[]? |
| `studentSchema` | username, password?, name, surname, email?, phone?, address, img?, bloodType, birthday, sex, gradeId, classId, parentId |
| `examSchema` | title, startTime, endTime, lessonId |

**Schemas needed:** parent, lesson, assignment, result, attendance, event, announcement

---

## 8. Configuration

### Route Access Map (`src/lib/settings.ts`)

Maps URL patterns to allowed roles. Used by middleware.

### Pagination

`ITEM_PER_PAGE = 10` — used by all list pages

### Middleware Matcher

Runs on all routes except static assets and Next.js internals.

---

## 9. Database Seed Data

**File:** `prisma/seed.ts`

| Entity | Count |
|--------|-------|
| Admins | 2 |
| Grades | 6 (levels 1–6) |
| Classes | 6 (1A–6A) |
| Subjects | 10 |
| Teachers | 15 |
| Lessons | 30 |
| Parents | 25 |
| Students | 50 |
| Exams | 10 |
| Assignments | 10 |
| Results | 10 |
| Attendances | 10 |
| Events | 5 |
| Announcements | 5 |

**Note:** Seed does not create Clerk users. Login requires creating Clerk accounts separately or using teacher/student CRUD forms.
