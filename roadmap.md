

# 1) MVP scope — what’s in vs out

**IN (MVP):**

* User sign-up/login (individual & organization accounts)
* User profiles (bio, avatar, headline, experiences)
* Follow / connection model (follow-first; connection request optional toggle)
* Post feed: create posts (text + images), feed (follow-based), like/comment
* Job posting by companies (create, list, apply via resume upload or external URL)
* Real-time chat between users (1:1)
* Basic notifications (in-app)
* Basic search (users, companies, jobs)
* Admin dashboard (user/job moderation, basic analytics)
* File storage for avatars, post images, and resumes



Below are simplified schemas. Use Prisma/TypeORM equivalents.

**users**

* id (uuid)
* email (unique)
* password_hash
* name
* headline
* bio
* avatar_url
* type (`individual` | `organization`)
* organization_id (nullable) — for org-owned accounts
* is_verified_email
* created_at, updated_at

**organizations**

* id (uuid)
* name
* slug
* logo_url
* description
* created_by_user_id

**connections** (follow/connection)

* id
* follower_id (user)
* followee_id (user or organization)
* type (`follow` or `connection`) — connection requests may need status
* status (`accepted`, `pending`, `rejected`) — if you support connection requests
* created_at

**posts**

* id
* author_id (user or organization)
* content_text
* attachments (JSON array of S3 URLs)
* visibility (public, connections_only)
* likes_count
* comments_count
* created_at, updated_at

**comments**

* id
* post_id
* author_id
* text
* created_at

**likes**

* id
* user_id
* target_type (`post`/`comment`)
* target_id
* created_at

**jobs**

* id
* company_id (organization)
* title
* description
* location (text)
* employment_type (full-time, part-time, remote)
* apply_url (optional)
* active (boolean)
* created_by
* created_at

**applications**

* id
* job_id
* applicant_user_id
* resume_url
* cover_letter
* status
* applied_at

**messages** (chat)

* id
* conversation_id (uuid)
* sender_id
* text
* attachments
* created_at
* read_at (nullable)

**conversations**

* id
* participant_ids (array)
* last_message_id
* created_at

**notifications**

* id
* user_id
* type (like, comment, connection_request, message, job_suggest)
* payload (JSON)
* read (bool)
* created_at

---

# 5) API design & implementation notes (feature-by-feature)

I’ll give endpoints, key flows, validations, and implementation tips.

## Authentication & Accounts (Org + Individual)

Endpoints:

* `POST /auth/signup` — body includes `{email, password, name, type}`; for org type allow `organization_name` & owner info
* `POST /auth/login` — returns `access_token` and `refresh_token`
* `POST /auth/refresh` — refresh tokens
* `GET /auth/me` — profile
* `POST /auth/verify-email` — verification flow
* `POST /auth/reset-password-request``, `POST /auth/reset-password`

Implementation notes:

* Use **bcrypt** with strong cost factor. Store only hashed passwords.
* Use short-lived access tokens (~15m) + refresh tokens (rotate).
* For org accounts, maintain `organizations` table with owner user id. Allow user to be member of multiple orgs later.
* Email verification sent after sign up; require before some actions (create job) — configurable use nodemailer
Edge cases:

* Duplicate email: return helpful error.
* Social logins can be added later (OAuth).

## Profiles

Endpoints:

* `GET /users/:id`
* `PUT /users/me` (update profile)
* `POST /users/me/avatar` (signed S3 upload)

Notes:

* Validate uploads (max size, image types).
* Keep public profile fields and private fields separated.

## Follow 

one simple feature 

**Model : Follow **

* `POST /follow` `{target_id}` — create follower relationship
* `DELETE /follow/:id`


Implementation:

* Use DB uniqueness constraint to prevent duplicate relations.
* Notification on request/accept.
* Privacy settings: allow connections only.

## Posts (create & feed)

Endpoints:

* `POST /posts` `{content, attachments, visibility}`
* `GET /posts/:id`
* `GET /feed?cursor=&limit=&type=following` — cursor pagination
* `POST /posts/:id/like`
* `POST /posts/:id/comment`

Feed algorithm (simple for MVP):

* Feed = posts by users you follow sorted by created_at (desc) with optional boosts for posts with likes/comments in recent time window. Use cursor-based pagination.
* For scale: precompute feed via fan-out-on-write for active users, else use pull model (query posts by followed ids with limit).

Storage:

use uploadthing 

## Jobs

Endpoints:

* `POST /companies/:companyId/jobs` — create
* `GET /jobs` — search / list
* `GET /companies/:id/jobs`
* `POST /jobs/:jobId/apply` — provide resume (S3) or `apply_url`
* `GET /jobs/:id/applicants` — org-only

Notes:

* Authorize: only org admins can create jobs.
* Keep audit logs for posting.
* Job search: index job title + description into search engine.


# 6) Security & privacy (must-haves)

* HTTPS everywhere.
* Input validation & output encoding (prevent XSS).
* SQL injection protection via prepared statements/ORM.
* Rate limit endpoints (login/signup) by IP + user.
* Password policy + account lockout on suspicious attempts.
* CSRF protections for cookie-based flows; use same-site cookies.
* Encrypt sensitive data in transit & at rest (S3 server-side encryption).
* Logging of security events (login failures).
* GDPR basics: deletion flow for accounts (mark as deleted then physically delete later).
