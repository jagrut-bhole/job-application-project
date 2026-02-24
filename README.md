# Job Tracker Application — Wellfound-Style Platform

A full-stack job board application built with **Next.js 15**, **Prisma**, **PostgreSQL**, and **NextAuth.js**.

Admins post jobs under companies. Users browse open jobs and apply. Each user sees only their own applications. Admins see all applications and can update statuses.

---

## Table of Contents

- [Platform Overview](#platform-overview)
- [Roles](#roles)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
  - [Auth Routes](#auth-routes)
  - [Admin Routes — Companies](#admin-routes--companies)
  - [Admin Routes — Jobs](#admin-routes--jobs)
  - [Admin Routes — Applications](#admin-routes--applications)
  - [Admin Routes — Users](#admin-routes--users)
  - [Public Routes — Jobs](#public-routes--jobs)
  - [User Routes — Applications](#user-routes--applications)
  - [User Routes — Profile](#user-routes--profile)
- [Application Status Flow](#application-status-flow)
- [Tech Stack](#tech-stack)

---

## Platform Overview

```
Admin                        User
  │                            │
  ├── Create Company           ├── Browse Jobs
  ├── Post Jobs                ├── Apply to Job (with Cover Letter)
  ├── View All Applications    ├── View Own Applications
  └── Update App Status        └── Withdraw Application
```

---

## Roles

| Role  | Capabilities                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------ |
| ADMIN | Register (via admin route), create companies, post jobs, manage all applications, view all users |
| USER  | Register, browse jobs, apply to jobs, track own applications, manage profile                     |

---

## Database Schema

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ─────────────────────────────────────────
// USER
// ─────────────────────────────────────────
model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  password     String
  role         Role     @default(USER)
  bio          String?
  skills       String[]
  resumeUrl    String?
  profileImage String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  applications Application[] @relation("appliedBy")
  companies    Company[]     @relation("managedBy")

  @@index([email])
  @@index([role])
}

enum Role {
  USER
  ADMIN
}

// ─────────────────────────────────────────
// COMPANY  (created and managed by ADMIN)
// ─────────────────────────────────────────
model Company {
  id          String   @id @default(uuid())
  name        String
  description String?
  website     String?
  logoUrl     String?
  location    String[]?
  adminId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  admin User  @relation("managedBy", fields: [adminId], references: [id], onDelete: Cascade)
  jobs  Job[] @relation("postedIn")

  @@index([adminId])
}

// ─────────────────────────────────────────
// JOB  (posted by ADMIN under a Company)
// ─────────────────────────────────────────
model Job {
  id          String    @id @default(uuid())
  title       String
  description String
  salary      String?
  location    String?
  type        JobType   @default(FULL_TIME)
  status      JobStatus @default(OPEN)
  companyId   String
  postedById  String
  postedAt    DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  expiresAt   DateTime?

  company      Company       @relation("postedIn", fields: [companyId], references: [id], onDelete: Cascade)
  applications Application[] @relation("jobApplications")

  @@index([companyId])
  @@index([status])
  @@index([type])
}

enum JobType {
  FULL_TIME
  PART_TIME
  CONTRACT
  INTERNSHIP
  REMOTE
}

enum JobStatus {
  OPEN
  CLOSED
  PAUSED
}

// ─────────────────────────────────────────
// APPLICATION  (user applies to a job)
// ─────────────────────────────────────────
model Application {
  id          String            @id @default(uuid())
  userId      String
  jobId       String
  status      ApplicationStatus @default(PENDING)
  coverLetter String?
  appliedAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  user  User  @relation("appliedBy", fields: [userId], references: [id], onDelete: Cascade)
  job   Job   @relation("jobApplications", fields: [jobId], references: [id], onDelete: Cascade)
  notes Note[] @relation("appNotes")

  @@unique([userId, jobId])   // prevents duplicate applications
  @@index([userId])
  @@index([jobId])
  @@index([status])
}

enum ApplicationStatus {
  PENDING       // just applied, not reviewed yet
  REVIEWED      // admin opened the application
  SHORTLISTED   // moved to shortlist
  INTERVIEW     // interview scheduled
  OFFER         // offer extended
  REJECTED      // rejected by admin
  HIRED         // hired
  WITHDRAWN     // withdrawn by user
}

// ─────────────────────────────────────────
// NOTE  (admin adds notes to an application)
// ─────────────────────────────────────────
model Note {
  id            String      @id @default(uuid())
  applicationId String
  text          String
  addedAt       DateTime    @default(now())

  application Application @relation("appNotes", fields: [applicationId], references: [id], onDelete: Cascade)
}
```

---

## API Routes

### Auth Routes

| Method | Route                       | Access   | Description                                                                             |
| ------ | --------------------------- | -------- | --------------------------------------------------------------------------------------- |
| POST   | `/api/auth/register`        | Public   | Register a new USER account                                                             |
| POST   | `/api/auth/admin/register`  | Public\* | Register a new ADMIN account (`role: ADMIN` set server-side, protected by a secret key) |
| POST   | `/api/auth/[...nextauth]`   | Public   | NextAuth sign-in / sign-out / session                                                   |
| GET    | `/api/auth/profile`         | USER     | Get own profile                                                                         |
| PUT    | `/api/auth/profile`         | USER     | Update own profile (name, bio, skills, resumeUrl, profileImage)                         |
| PUT    | `/api/auth/change-password` | USER     | Change password                                                                         |
| DELETE | `/api/auth/delete-account`  | USER     | Delete own account                                                                      |

> \* Admin registration is protected by a `ADMIN_SECRET` env variable sent in the request body.

---

### Admin Routes — Companies

| Method | Route                      | Access | Description                    |
| ------ | -------------------------- | ------ | ------------------------------ |
| POST   | `/api/admin/companies`     | ADMIN  | Create a new company           |
| GET    | `/api/admin/companies`     | ADMIN  | List all companies (own)       |
| GET    | `/api/admin/companies/:id` | ADMIN  | Get single company details     |
| PUT    | `/api/admin/companies/:id` | ADMIN  | Update company info            |
| DELETE | `/api/admin/companies/:id` | ADMIN  | Delete company (cascades jobs) |

**POST `/api/admin/companies` — Request Body**

```json
{
  "name": "Acme Corp",
  "description": "We build tools.",
  "website": "https://acme.com",
  "logoUrl": "https://...",
  "location": "San Francisco, CA"
}
```

---

### Admin Routes — Jobs

| Method | Route                 | Access | Description                               |
| ------ | --------------------- | ------ | ----------------------------------------- |
| POST   | `/api/admin/jobs`     | ADMIN  | Post a new job under a company            |
| GET    | `/api/admin/jobs`     | ADMIN  | List all jobs posted by this admin        |
| GET    | `/api/admin/jobs/:id` | ADMIN  | Get job details + application count       |
| PUT    | `/api/admin/jobs/:id` | ADMIN  | Edit job (title, description, status etc) |
| DELETE | `/api/admin/jobs/:id` | ADMIN  | Delete job (cascades applications)        |

**POST `/api/admin/jobs` — Request Body**

```json
{
  "companyId": "uuid",
  "title": "Senior Frontend Engineer",
  "description": "We are looking for...",
  "salary": "$120k – $160k",
  "location": "Remote",
  "type": "FULL_TIME",
  "status": "OPEN",
  "expiresAt": "2026-04-01T00:00:00.000Z"
}
```

**PUT `/api/admin/jobs/:id` — Updatable fields**

```json
{
  "title": "...",
  "description": "...",
  "salary": "...",
  "location": "...",
  "type": "PART_TIME",
  "status": "CLOSED",
  "expiresAt": "..."
}
```

---

### Admin Routes — Applications

| Method | Route                                       | Access | Description                                    |
| ------ | ------------------------------------------- | ------ | ---------------------------------------------- |
| GET    | `/api/admin/applications`                   | ADMIN  | Get all applications (filter by jobId, status) |
| GET    | `/api/admin/applications/:id`               | ADMIN  | Get single application with applicant details  |
| PUT    | `/api/admin/applications/:id`               | ADMIN  | Update application status                      |
| POST   | `/api/admin/applications/:id/notes`         | ADMIN  | Add a note to an application                   |
| GET    | `/api/admin/applications/:id/notes`         | ADMIN  | Get all notes for an application               |
| DELETE | `/api/admin/applications/:id/notes/:noteId` | ADMIN  | Delete a note                                  |

**PUT `/api/admin/applications/:id` — Request Body**

```json
{
  "status": "SHORTLISTED"
}
```

**POST `/api/admin/applications/:id/notes` — Request Body**

```json
{
  "text": "Strong portfolio. Schedule interview."
}
```

**Query params for GET `/api/admin/applications`**

```
?jobId=uuid
?status=PENDING
?page=1&limit=20
```

---

### Admin Routes — Users

| Method | Route                  | Access | Description                               |
| ------ | ---------------------- | ------ | ----------------------------------------- |
| GET    | `/api/admin/users`     | ADMIN  | List all registered users                 |
| GET    | `/api/admin/users/:id` | ADMIN  | Get a user's profile + their applications |
| DELETE | `/api/admin/users/:id` | ADMIN  | Delete a user account                     |

---

### Public Routes — Jobs

These routes are accessible to everyone (authenticated or not) so users can browse jobs.

| Method | Route           | Access | Description                                           |
| ------ | --------------- | ------ | ----------------------------------------------------- |
| GET    | `/api/jobs`     | Public | List all OPEN jobs (with filters, search, pagination) |
| GET    | `/api/jobs/:id` | Public | Get full job details + company info                   |

**Query params for GET `/api/jobs`**

```
?search=frontend          // searches title & description
?type=FULL_TIME
?location=Remote
?companyId=uuid
?page=1&limit=20
```

**Response shape for GET `/api/jobs`**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Senior Frontend Engineer",
      "type": "FULL_TIME",
      "location": "Remote",
      "salary": "$120k – $160k",
      "postedAt": "2026-02-19T...",
      "company": {
        "id": "uuid",
        "name": "Acme Corp",
        "logoUrl": "https://...",
        "location": "San Francisco, CA"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 84
  }
}
```

---

### User Routes — Applications

| Method | Route                     | Access | Description                                     |
| ------ | ------------------------- | ------ | ----------------------------------------------- |
| POST   | `/api/applications/apply` | USER   | Apply to a job                                  |
| GET    | `/api/applications`       | USER   | Get all of the logged-in user's applications    |
| GET    | `/api/applications/:id`   | USER   | Get a single application (must belong to user)  |
| DELETE | `/api/applications/:id`   | USER   | Withdraw an application (sets status WITHDRAWN) |

**POST `/api/applications/apply` — Request Body**

```json
{
  "jobId": "uuid",
  "coverLetter": "I am excited to apply because..."
}
```

**Response for GET `/api/applications`**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "SHORTLISTED",
      "appliedAt": "2026-02-19T...",
      "job": {
        "id": "uuid",
        "title": "Senior Frontend Engineer",
        "type": "FULL_TIME",
        "company": {
          "name": "Acme Corp",
          "logoUrl": "https://..."
        }
      }
    }
  ]
}
```

---

### User Routes — Profile

| Method | Route                       | Access | Description                                    |
| ------ | --------------------------- | ------ | ---------------------------------------------- |
| GET    | `/api/auth/profile`         | USER   | Get own profile (name, bio, skills, resumeUrl) |
| PUT    | `/api/auth/profile`         | USER   | Update profile                                 |
| PUT    | `/api/auth/change-password` | USER   | Change password                                |
| DELETE | `/api/auth/delete-account`  | USER   | Delete own account                             |

---

## Application Status Flow

```
User applies
     │
     ▼
  PENDING
     │
     ├──► REVIEWED
     │         │
     │         ├──► SHORTLISTED
     │         │         │
     │         │         ├──► INTERVIEW
     │         │         │         │
     │         │         │         ├──► OFFER ──► HIRED
     │         │         │         │
     │         │         │         └──► REJECTED
     │         │         │
     │         │         └──► REJECTED
     │         │
     │         └──► REJECTED
     │
     └──► WITHDRAWN  (user withdraws at any stage)
```

---

## Folder Structure (Planned)

```
app/
  api/
    auth/
      register/           POST — user registration
      admin/
        register/         POST — admin registration (secret-protected)
      [...nextauth]/      NextAuth handler
      profile/            GET, PUT
      change-password/    PUT
      delete-account/     DELETE
    admin/
      companies/
        route.ts          GET (list), POST (create)
        [id]/
          route.ts        GET, PUT, DELETE
      jobs/
        route.ts          GET (list), POST (create)
        [id]/
          route.ts        GET, PUT, DELETE
      applications/
        route.ts          GET (all, with filters)
        [id]/
          route.ts        GET, PUT (status update)
          notes/
            route.ts      GET, POST
            [noteId]/
              route.ts    DELETE
      users/
        route.ts          GET (list)
        [id]/
          route.ts        GET, DELETE
    jobs/
      route.ts            GET (public listing)
      [id]/
        route.ts          GET (public detail)
    applications/
      apply/
        route.ts          POST
      route.ts            GET (user's own)
      [id]/
        route.ts          GET, DELETE (withdraw)
  (app)/
    (auth)/
      login/
      register/
    (application)/
      dashboard/          User dashboard — own applications
      jobs/               Browse all open jobs
      jobs/[id]/          Job detail + apply button
      admin/
        dashboard/        Admin overview
        companies/        Manage companies
        jobs/             Manage job postings
        applications/     Review applications
```

---

## Tech Stack

| Layer       | Technology                       |
| ----------- | -------------------------------- |
| Framework   | Next.js 15 (App Router)          |
| Language    | TypeScript                       |
| Auth        | NextAuth.js v4 (Credentials)     |
| ORM         | Prisma (prisma-client generator) |
| Database    | PostgreSQL (Neon / Supabase)     |
| Styling     | Tailwind CSS + shadcn/ui         |
| Validation  | Zod                              |
| HTTP Client | Axios                            |

---

## Environment Variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_REGISTER_SECRET="your-admin-secret"  # protects admin registration endpoint
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Push schema to database
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```
