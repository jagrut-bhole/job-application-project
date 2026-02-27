# Backend Routes — Full Plan

## Legend

- ✅ Done & working
- ⚠️ File exists but broken / empty
- ❌ Not built yet

---

## AUTH (`/api/auth/...`)

| Method | Route                       | Status   | Notes                                                                                                                                                                                   |
| ------ | --------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/auth/register`        | ✅       | User registration                                                                                                                                                                       |
| POST   | `/api/auth/[...nextauth]`   | ✅       | NextAuth login/session                                                                                                                                                                  |
| POST   | `/api/auth/profile`         | ✅       | Get own profile                                                                                                                                                                         |
| PATCH  | `/api/auth/profile`         | ❌  -> ✅      | **Update** profile (bio, skills, profileImage, resumeUrl) — only GET exists right now                                                                                                   |
| PATCH  | `/api/auth/change-password` | ✅       | Change password                                                                                                                                                                         |
| DELETE | `/api/auth/delete-account`  | ✅       | Delete account                                                                                                                                                                          |
| POST   | `/api/auth/applied`         | ⚠️ -> ✅ | **OLD SCHEMA** — uses deleted fields (`position`, `company`, `jobDescription`, `appliedDate`). Either delete this file or rewrite it. It is replaced by `/api/application/user/applied` |

---

## USER — Jobs (`/api/application/user/...`)

| Method | Route                                                  | Status | Notes                                                                                       |
| ------ | ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------- |
| GET    | `/api/application/user/all-jobs`                       | ✅     | Paginated list of OPEN jobs user has NOT applied to                                         |
| GET    | `/api/application/user/job/[jobId]`                    | ❌     | Single job detail page                                                                      |
| GET    | `/api/application/user/applied`                        | ⚠️     | **File is EMPTY** — needs to be written. Fetch all applications with job + company + status |
| POST   | `/api/application/user/apply/[jobId]`                  | ❌     | Apply to a job — creates an `Application` row                                               |
| PATCH  | `/api/application/user/apply/[applicationId]/withdraw` | ❌     | Withdraw application — sets status to `WITHDRAWN`                                           |

---

## USER — Messages (`/api/application/user/messages/...`)

| Method | Route                                             | Status | Notes                                           |
| ------ | ------------------------------------------------- | ------ | ----------------------------------------------- |
| GET    | `/api/application/user/messages`                  | ✅     | Get all messages received by user (from admin)  |
| POST   | `/api/application/user/messages/[applicationId]`  | ❌     | User replies to admin on a specific application |
| PATCH  | `/api/application/user/messages/[messageId]/read` | ❌     | Mark a message as read (`isRead: true`)         |

---

## ADMIN — Company (`/api/application/admin/...`)

| Method | Route                                   | Status | Notes                                                       |
| ------ | --------------------------------------- | ------ | ----------------------------------------------------------- |
| POST   | `/api/application/admin/create-company` | ✅     | Create company (one per admin)                              |
| GET    | `/api/application/admin/company`        | ❌     | Get admin's own company details                             |
| PATCH  | `/api/application/admin/company`        | ❌     | Update company (name, description, logo, website, location) |

---

## ADMIN — Jobs

| Method | Route                                       | Status | Notes                                                    |
| ------ | ------------------------------------------- | ------ | -------------------------------------------------------- |
| POST   | `/api/application/admin/post-job`           | ✅     | Post a new job                                           |
| GET    | `/api/application/admin/jobs`               | ❌     | Get all jobs posted by this admin (with applicant count) |
| GET    | `/api/application/admin/job/[jobId]`        | ❌     | Single job detail for admin                              |
| PATCH  | `/api/application/admin/job/[jobId]`        | ❌     | Edit job details                                         |
| PATCH  | `/api/application/admin/job/[jobId]/status` | ❌     | Change job status: `OPEN / CLOSED / PAUSED`              |
| DELETE | `/api/application/admin/job/[jobId]`        | ❌     | Delete a job (cascades to applications)                  |

---

## ADMIN — Applications

| Method | Route                                                        | Status | Notes                                                                                             |
| ------ | ------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------- |
| GET    | `/api/application/admin/applications`                        | ❌     | Get all applications for admin's jobs (filterable by status)                                      |
| GET    | `/api/application/admin/applications/[applicationId]`        | ❌     | Full detail of one application (user info, cover letter, resume)                                  |
| PATCH  | `/api/application/admin/applications/[applicationId]/status` | ❌     | **Core feature** — change status: `REVIEWED / SHORTLISTED / INTERVIEW / OFFER / REJECTED / HIRED` |

---

## ADMIN — Messages

| Method | Route                                              | Status | Notes                                                 |
| ------ | -------------------------------------------------- | ------ | ----------------------------------------------------- |
| GET    | `/api/application/admin/messages`                  | ❌     | All messages received by admin                        |
| POST   | `/api/application/admin/messages/[applicationId]`  | ❌     | Admin sends message to user on a specific application |
| PATCH  | `/api/application/admin/messages/[messageId]/read` | ❌     | Mark message as read                                  |

---

## ADMIN — Notes (internal, user never sees these)

| Method | Route                                          | Status | Notes                               |
| ------ | ---------------------------------------------- | ------ | ----------------------------------- |
| POST   | `/api/application/admin/notes/[applicationId]` | ❌     | Add internal note to an application |
| GET    | `/api/application/admin/notes/[applicationId]` | ❌     | Get all notes for an application    |
| DELETE | `/api/application/admin/notes/[noteId]`        | ❌     | Delete a note                       |

---

## Priority Order to Build

### Phase 1 — Core user flow (do these first)

1. `POST /api/application/user/apply/[jobId]` — without this, users can't apply
2. `GET /api/application/user/applied` — fill the empty file
3. `PATCH /api/application/admin/applications/[applicationId]/status` — admin reviews/accepts
4. `POST /api/application/admin/messages/[applicationId]` — admin messages user after status change
5. `GET /api/application/user/messages` — already done ✅

### Phase 2 — Admin management

6. `GET /api/application/admin/applications`
7. `GET /api/application/admin/jobs`
8. `GET /api/application/admin/company`
9. `PATCH /api/application/admin/job/[jobId]/status`

### Phase 3 — Polish

10. `PATCH /api/auth/profile` — let users update their bio/skills/resume
11. `GET /api/application/user/job/[jobId]` — job detail page
12. `PATCH /api/application/user/apply/[applicationId]/withdraw`
13. Message read receipts (`PATCH .../read`)
14. Admin notes CRUD
15. Fix / delete the broken `/api/auth/applied` route

---

## Things to Also Write (Non-Route Code)

| What                          | Where                              | Why                                                                                                |
| ----------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| Middleware for role guard     | `middleware.ts` at root            | Protect `/admin/*` pages at the Next.js edge level instead of checking role in every route handler |
| Zod schemas for new routes    | next to each `route.ts`            | `apply`, `updateStatus`, `sendMessage`, `updateProfile` all need validation schemas                |
| `apiAxios/` request functions | `apiAxios/`                        | Frontend needs typed functions for every new route (like `authRequests.ts` already has)            |
| Pagination util               | `helpers/`                         | `all-jobs` has hardcoded `currentPage = 1` — extract a reusable `getPaginationParams(req)` helper  |
| Unread message count          | inside profile or a separate route | Show badge count in UI — query `Message.count where receiverId = user.id AND isRead = false`       |
