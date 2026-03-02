# Backend Routes — Full Plan

## Legend

- ✅ Done & working
- 🔧 Done but has bugs (see Bug Report below)
- ❌ Not built yet

---

## AUTH (`/api/auth/...`)

| Method | Route                       | Status | Notes                                                                                                                         |
| ------ | --------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/auth/register`        | 🔧     | User registration — typo "succcessfully", 200 instead of 409 on dupe, no `.email()` validation, logs password                 |
| POST   | `/api/auth/[...nextauth]`   | ✅     | NextAuth login/session                                                                                                        |
| GET    | `/api/auth/profile`         | ✅     | Get own profile                                                                                                               |
| PATCH  | `/api/auth/profile`         | 🔧     | Update profile — `resumeUrl` & `profileImage` both set to logo upload, `logo.arrayBuffer()` crashes if no logo, typo "Invlid" |
| PATCH  | `/api/auth/change-password` | 🔧     | Change password — 401 instead of 400 for validation error, typo "charater"                                                    |
| DELETE | `/api/auth/delete-account`  | 🔧     | Delete account — typo "Uauthorized", 500 for validation error, wrong error message                                            |
| GET    | `/api/auth/applied`         | ✅     | User's applied jobs (fixed: was using include+select conflict)                                                                |

---

## USER — Jobs (`/api/application/user/...`)

| Method | Route                                                  | Status | Notes                                                                            |
| ------ | ------------------------------------------------------ | ------ | -------------------------------------------------------------------------------- |
| GET    | `/api/application/user/all-jobs`                       | 🔧     | Paginated jobs — but pagination is hardcoded (page 1 always), 402 instead of 401 |
| GET    | `/api/application/user/[jobId]`                        | 🔧     | Single job detail — 401 instead of 400 for invalid ID                            |
| POST   | `/api/application/user/apply/[jobId]`                  | 🔧     | Apply to job — Zod error object as message, several wrong status codes           |
| PATCH  | `/api/application/user/apply/[applicationId]/withdraw` | ✅     | Withdraw application (fixed: was deleting the user!)                             |

---

## USER — Messages (`/api/application/user/messages/...`)

| Method | Route                                             | Status | Notes                                                                       |
| ------ | ------------------------------------------------- | ------ | --------------------------------------------------------------------------- |
| GET    | `/api/application/user/messages`                  | 🔧     | Get user messages — 402 instead of 401                                      |
| POST   | `/api/application/user/messages/[applicationId]`  | ✅     | User replies to admin (fixed: wrong handler signature)                      |
| PATCH  | `/api/application/user/messages/[messageId]/read` | ✅     | Mark message as read (fixed: wrong signature + checked sender not receiver) |

---

## ADMIN — Company (`/api/application/admin/...`)

| Method | Route                                   | Status | Notes                                                                                      |
| ------ | --------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| POST   | `/api/application/admin/create-company` | 🔧     | Create company — Zod error as message, typo "Invlid", typo "Not a random request", 401→400 |
| GET    | `/api/application/admin/company`        | 🔧     | Get company — 402 instead of 401                                                           |
| PATCH  | `/api/application/admin/company`        | ✅     | Update company (fixed: `success: true` on error, logo crash, missing return)               |

---

## ADMIN — Jobs

| Method | Route                                       | Status | Notes                                                               |
| ------ | ------------------------------------------- | ------ | ------------------------------------------------------------------- |
| POST   | `/api/application/admin/post-job`           | 🔧     | Post job — 402→403 for forbidden, 401→400 for validation            |
| GET    | `/api/application/admin/all-jobs`           | 🔧     | All jobs — `...jobs` spread array into object, 404 → 401            |
| GET    | `/api/application/admin/job/[jobId]`        | ✅     | Single job detail (now includes notes in response)                  |
| PATCH  | `/api/application/admin/job/[jobId]`        | ✅     | Edit job details (now auto-creates system note with changed fields) |
| PATCH  | `/api/application/admin/job/[jobId]/status` | ✅     | Change job status — auto-creates system `JobNote`                   |
| DELETE | `/api/application/admin/job/[jobId]`        | ✅     | Delete a job (cascades applications + notes)                        |

---

## ADMIN — Job Notes (activity log on jobs — `JobNote` model)

| Method | Route                                      | Status | Notes                                       |
| ------ | ------------------------------------------ | ------ | ------------------------------------------- |
| GET    | `/api/application/admin/job/[jobId]/notes` | ✅     | Fetch all notes for a job (system + manual) |
| POST   | `/api/application/admin/job/[jobId]/notes` | ✅     | Admin manually adds a USER-type note        |

---

## ADMIN — Applications

| Method | Route                                                        | Status | Notes                                                                           |
| ------ | ------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------- |
| GET    | `/api/application/admin/applications`                        | ✅     | All applications for admin's jobs (filterable by `?status=`, paginated)         |
| GET    | `/api/application/admin/applications/[applicationId]`        | ✅     | Full application detail (user info, cover letter, resume, notes, messages)      |
| PATCH  | `/api/application/admin/applications/[applicationId]/status` | ✅     | **Core feature** — change status; auto-creates system `Note` on the application |

---

## ADMIN — Messages

| Method | Route                                              | Status | Notes                                                                    |
| ------ | -------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| GET    | `/api/application/admin/messages`                  | ✅     | All messages received by admin (paginated, `?unreadOnly=true` supported) |
| POST   | `/api/application/admin/messages/[applicationId]`  | ✅     | Admin sends message to user on a specific application                    |
| PATCH  | `/api/application/admin/messages/[messageId]/read` | ✅     | Mark a message as read                                                   |

---

## ADMIN — Application Notes (internal admin notes — user never sees these, `Note` model)

| Method | Route                                          | Status | Notes                               |
| ------ | ---------------------------------------------- | ------ | ----------------------------------- |
| POST   | `/api/application/admin/notes/[applicationId]` | ✅     | Add internal note to an application |
| GET    | `/api/application/admin/notes/[applicationId]` | ✅     | Get all notes for an application    |
| DELETE | `/api/application/admin/notes/[noteId]`        | ✅     | Delete a note                       |

---

## System-Generated Notes

The following actions **automatically create notes** so the admin always has an activity trail:

| Action                               | Note Model              | Example Text                                                                                      |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Admin changes **Job** status         | `JobNote` (SYSTEM)      | `Status changed from OPEN → CLOSED. Job has been closed — no more applications will be accepted.` |
| Admin **edits** job details          | `JobNote` (SYSTEM)      | `Job details updated. Changed fields: title, salary.`                                             |
| Admin changes **Application** status | `Note` (on application) | `Status changed from PENDING → INTERVIEW. Interview has been scheduled.`                          |

Admins can also **manually add notes** to both jobs (`POST /job/[jobId]/notes`) and applications (`POST /notes/[applicationId]`).

---

## Bug Report — Existing Code Issues

### 🔴 CRITICAL (were fixed)

| #   | File                                           | Bug                                                                                               | Fix Applied                                                           |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | `user/apply/[applicationId]/withdraw/route.ts` | **`tx.user.delete()` deletes the entire user** instead of withdrawing                             | Removed the `tx.user.delete()` — now just updates status to WITHDRAWN |
| 2   | `user/messages/[applicationId]/route.ts`       | Wrong handler signature (`applicationId: string` instead of `{ params }`)                         | Fixed to `{ params }: { params: Promise<{...}> }` with `await params` |
| 3   | `user/messages/[messageId]/read/route.ts`      | Wrong handler signature + checks `senderId` instead of `receiverId`                               | Fixed both signature and the auth check                               |
| 4   | `auth/applied/route.ts`                        | Uses both `include` and `select` on same relation — Prisma runtime crash                          | Restructured to use only `select` with nested company                 |
| 5   | `admin/company/route.ts` (PATCH)               | `success: true` on validation error, `logo.arrayBuffer()` before null check, no return on success | Fixed all three issues                                                |

### 🟡 MEDIUM — Wrong HTTP Status Codes (not yet fixed)

These are non-critical but should be corrected for proper REST semantics:

| File                            | Current → Should Be | Context               |
| ------------------------------- | ------------------- | --------------------- |
| `auth/register/route.ts`        | 200 → **409**       | User already exists   |
| `auth/profile/route.ts` (PATCH) | 401 → **400**       | Validation error      |
| `auth/change-password`          | 401 → **400**       | Validation error      |
| `auth/delete-account`           | 500 → **400**       | Validation error      |
| `admin/create-company`          | 401 → **400**       | Validation error      |
| `admin/post-job`                | 402 → **403**       | Forbidden             |
| `admin/post-job`                | 401 → **400**       | Validation error      |
| `admin/company` (GET)           | 402 → **401**       | Unauthorized          |
| `admin/all-jobs`                | 404 → **401**       | Unauthorized          |
| `user/[jobId]`                  | 401 → **400**       | Invalid jobId         |
| `user/all-jobs`                 | 402 → **401**       | Unauthorized          |
| `user/apply/[jobId]`            | 401 → **400**       | Invalid/closed/skills |
| `user/messages`                 | 402 → **401**       | Unauthorized          |

### 🟡 MEDIUM — ZodError Object Passed as Response Message (not yet fixed)

These pass the full `validationResult.error` object as `message`, producing bloated JSON:

- `admin/create-company/route.ts`
- `auth/profile/route.ts` (PATCH)
- `user/apply/[jobId]/route.ts`

**Fix:** Use `validationResult.error.issues[0]?.message ?? "Invalid request"` instead.

### 🔵 LOW — Typos (not yet fixed)

| File                                           | Typo                                     | Should Be                                      |
| ---------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| `auth/register/route.ts`                       | "succcessfully"                          | "successfully"                                 |
| `auth/delete-account/route.ts`                 | "Uauthorized"                            | "Unauthorized"                                 |
| `auth/profile/route.ts`                        | "Invlid"                                 | "Invalid"                                      |
| `admin/create-company/route.ts`                | "Invlid"                                 | "Invalid"                                      |
| `admin/create-company/route.ts`                | "Not a random request"                   | "Not authorized"                               |
| `user/apply/[jobId]/route.ts`                  | "Invlid"                                 | "Invalid"                                      |
| `auth/change-password/changePasswordSchema.ts` | "charater"                               | "character"                                    |
| `admin/create-company/CreateCompanySchema.ts`  | "Not should be more than 500 characters" | "Should not be more than 500 characters"       |
| `admin/job/[jobId]/SingleJobDetail.ts`         | `singleJobDetailsReauest`                | `singleJobDetailsRequest` (variable name typo) |

### 🔵 LOW — Design Issues (not yet fixed)

| File                              | Issue                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `auth/register/RegisterSchema.ts` | `email` field has no `.email()` validation — accepts any string                                |
| `user/all-jobs/route.ts`          | Pagination hardcoded to page 1, `pageSize=20` — query params never read                        |
| `auth/register/route.ts`          | `console.log` prints password to server logs — security risk                                   |
| `auth/profile/route.ts` (PATCH)   | `resumeUrl` and `profileImage` both set to the same logo upload URL — resume is never uploaded |

### ⚠️ Next.js 16 `params` Note

On Next.js 16, route handler `params` is a **Promise** and must be awaited. All existing routes with `{ params }: { params: { jobId: string } }` should be migrated to `{ params }: { params: Promise<{ jobId: string }> }` with `const { jobId } = await params`. The **new routes** already use the correct pattern. Remaining routes to update:

- `admin/job/[jobId]/route.ts` (GET, PATCH, DELETE)
- `admin/job/[jobId]/status/route.ts`
- `admin/job/[jobId]/notes/route.ts`
- `user/[jobId]/route.ts`
- `user/apply/[jobId]/route.ts`
- `user/apply/[applicationId]/withdraw/route.ts`

---

## Remaining Work

### Already Done ✅

All route handlers are now built. The backend API is functionally complete.

### Still To-Do (polish)

| What                                             | Where                              | Priority        |
| ------------------------------------------------ | ---------------------------------- | --------------- |
| Fix wrong HTTP status codes                      | See table above                    | Medium          |
| Fix ZodError-as-message responses                | 3 files listed above               | Medium          |
| Fix typos                                        | See table above                    | Low             |
| Fix `register` `.email()` validation             | `RegisterSchema.ts`                | Medium          |
| Fix `user/all-jobs` pagination                   | Read `page` from query params      | Medium          |
| Fix `auth/profile` PATCH resume upload           | Upload resume separately from logo | High            |
| Remove password `console.log`                    | `auth/register/route.ts`           | High (security) |
| Migrate old-style `params` to `Promise<>`        | 6 route files listed above         | Medium          |
| Fix `admin/all-jobs` spread array into object    | `{...jobs}` → `{ jobs }`           | High            |
| Add `middleware.ts` role guard                   | Root level                         | Nice-to-have    |
| Add `apiAxios/` request functions for new routes | `apiAxios/`                        | For frontend    |
| Extract pagination utility helper                | `helpers/`                         | Nice-to-have    |
