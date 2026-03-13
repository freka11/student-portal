# Student Portal – Technical Overview (Auth, Roles, Q/A/Thoughts, Chat)

This document explains:

- What issues were fixed (Unauthorized / Internal Server Error / data-shape crashes)
- How authentication and role-based access control works end-to-end
- How **Questions**, **Thoughts**, and **Answers** flows work (admin/teacher/super_admin vs student)
- How **Chat** works (conversations/messages)
- How **Chat assignment / reassignment** works

> Scope: This describes the current behavior implemented across `backend/`, `student-admin/`, and `student-user/`.

---

## 1. High-level architecture

### 1.1 Services

- **Backend (Express + Firebase Admin SDK)**
  - Runs on `http://localhost:5000` by default.
  - Owns all privileged operations:
    - token verification
    - role checks
    - writes to protected Firestore collections for admin features (questions/thoughts/answers)

- **student-admin (Next.js + Firebase Client SDK)**
  - UI for roles: `admin`, `super_admin`, `teacher`.
  - Uses Firebase Client SDK for auth.
  - Calls backend REST APIs for admin features.
  - Uses Firestore Client SDK directly for **realtime chat**.

- **student-user (Next.js + Firebase Client SDK)**
  - UI for role: `student`.
  - Uses backend for reading questions / submitting answers / reading own answers.
  - Uses Firestore Client SDK directly for **realtime chat**.

### 1.2 Why chat is direct Firestore (not backend)

Chat depends on real-time updates:

- conversation list updates
- message streaming
- unread counts

Firestore client listeners provide this without custom websocket infrastructure.

---

## 2. Authentication & Authorization (why 401 / internal errors were happening)

### 2.1 Frontend authentication

Both `student-admin` and `student-user` authenticate with Firebase Client SDK.

Correct pattern used throughout secured pages:

1. `await auth.authStateReady()`
2. `const token = await auth.currentUser?.getIdToken()`
3. include `Authorization: Bearer <token>` header when calling backend

This prevents the timing bug where requests were sent before the user session was ready (the common cause of `401 Unauthorized`).

### 2.2 Backend authentication middleware

`backend/src/middleware/auth.middleware.ts`:

- validates the bearer token using Firebase Admin SDK
- loads user profile from Firestore `users/{uid}`
- attaches `req.user` so controllers and `requireRole` can authorize

### 2.3 Role-based access control

`backend/src/middleware/requireRole.ts`:

- checks `req.user.role`
- returns `401` if unauthenticated
- returns `403` if authenticated but insufficient role

### 2.4 Teacher permissions (admin-like)

Teacher role is allowed for:

- question management (create/update/delete/publish/draft)
- thought management (create/update/delete)
- admin answers view (view/delete answers)

This is implemented by including `teacher` in backend `requireRole([...])` lists on the relevant routes.

---

## 3. Data model overview (Firestore)

### 3.1 `users` collection

`users/{uid}` typically includes:

- `email`, `name`
- `role`: `student | teacher | admin | super_admin`
- `publicId` (e.g. `TCH-0001`, etc.)

### 3.2 `questions` collection

`questions/{id}` fields used by backend/UI:

- `text`: question content
- `status`: `published | draft`
- `deleted`: boolean (soft delete)
- `publishDate`: `YYYY-MM-DD`
- `createdBy`: `{ uid, name }`
- `createdAt`, `updatedAt`

### 3.3 `thoughts` collection

`thoughts/{id}`:

- `text`
- `publishDate`: `YYYY-MM-DD`
- `createdBy`, `updatedBy`
- timestamps

### 3.4 `answers` collection

Answer docs include:

- `questionId`
- `studentId`
- `studentName`
- `answer`
- `submittedAt`

### 3.5 `conversations` + `messages` (chat)

- `conversations/{conversationId}`: conversation metadata
- `conversations/{conversationId}/messages/{messageId}`: messages

Conversation assignment fields (present in `student-admin/src/lib/conversationService.ts`):

- `assignedTeacherId`
- `assignedTeacherName`
- `assignedTeacherPublicId`
- `assignedBy`
- `assignedAt`
- `status` (e.g. `unassigned`)
- `authorizedUserIds` (important for access constraints)

---

## 4. Questions feature (end-to-end)

### 4.1 Read questions (students)

Endpoint:

- `GET /api/questions` (today)
- `GET /api/questions?date=all` (all)

Behavior:

- Students see only:
  - `status === 'published'`
  - `deleted !== true`

### 4.2 Read questions (admin/super_admin/teacher)

Same endpoints as above, but called with an auth token.

Behavior:

- admin/super_admin/teacher see all non-deleted questions
- drafts are included

### 4.3 Create question

Endpoint:

- `POST /api/questions`

Payload accepted:

- `{ text: string, status?: 'draft'|'published' }`
- (backward-compatible) `{ question: string }`

Behavior:

- creates Firestore doc with `text`, `status`, `publishDate`, and `createdBy`

### 4.4 Update / publish / draft

Endpoint:

- `PATCH /api/questions?id=<questionId>`

Payload fields allowed:

- `text`
- `status`
- `deleted`
- `publishDate`

Why PATCH is used:

- publish/draft is just changing `status`
- editing text is also a partial update

### 4.5 Delete question (soft delete)

Endpoint:

- `DELETE /api/questions?id=<questionId>`

Behavior:

- sets `deleted: true` (does not remove document)

### 4.6 Bug fixes applied

- Fixed update/publish requests to always include `?id=<questionId>`.
- Aligned frontend payload field name to `text` (backend expects `text`).
- Backend now accepts `id` from either query or body as a fallback.
- Backend now accepts `text` or legacy `question` on create.

---

## 5. Thoughts feature (end-to-end)

### 5.1 Read thoughts (public)

Endpoint:

- `GET /api/thoughts` (today)
- `GET /api/thoughts?date=all`

Public endpoint (no auth required).

### 5.2 Create/update today’s thought

Endpoint:

- `POST /api/thoughts`

Behavior:

- if a thought doc already exists for today’s `publishDate`, it updates it
- otherwise it creates a new one

Role:

- requires `admin | super_admin | teacher`

### 5.3 Delete thought

Endpoint:

- `DELETE /api/thoughts?id=<thoughtId>`

Role:

- requires `admin | super_admin | teacher`

---

## 6. Answers feature (end-to-end)

### 6.1 Student submits an answer

Endpoint:

- `POST /api/answers`

Auth:

- requires a valid Firebase token

### 6.2 Student reads own answers

Endpoint:

- `GET /api/student/answers`

Auth:

- requires a valid Firebase token

Behavior:

- returns only the current student’s answers

### 6.3 Admin/teacher reads all answers

Endpoint:

- `GET /api/answers`

Role:

- requires `admin | super_admin | teacher`

Used by admin pages:

- `/admin/answers` (all answers)
- `/admin/answers/[questionId]` (answers filtered by question)

### 6.4 Bug fix: `answersData.filter is not a function`

Root cause:

- when role access was denied or API returned an error object, UI still did `answersData.filter(...)`.

Fix:

- UI sanitizes response: if not an array, treat as empty array
- backend allows teacher for admin answers endpoint

---

## 7. Chat feature (end-to-end)

### 7.1 Conversation creation

When a student or admin starts a chat, the frontend creates/ensures a `conversations/{conversationId}` document exists.

Conversation ID is deterministic (generated from the two user IDs) to avoid duplicates.

### 7.2 Messages

Messages are stored under:

- `conversations/{conversationId}/messages/{messageId}`

Sending a message typically does two things:

1. Add the message doc
2. Update the parent conversation’s `lastMessage`, `lastMessageTime`, unread counts

Unread count strategy (as implemented in `updateConversationLastMessage`):

- if sender is `student`, increment `adminUnreadCount`
- otherwise increment `studentUnreadCount`

### 7.3 Admin view vs Teacher view

`student-admin/src/app/admin/chat/page.tsx` selects hook based on role:

- Admin / super_admin uses `useChat`
- Teacher uses `useTeacherChat`

The teacher hook should restrict which conversations are visible (usually by assignment fields / authorized list).

---

## 8. Chat assignment / reassignment

### 8.1 UI behavior

Component:

- `student-admin/src/components/admin/ConversationAssignment.tsx`

Rules:

- Only `admin` and `super_admin` can assign/reassign
- Teachers only see the assigned teacher name (if assigned)

### 8.2 Backend API

Endpoint:

- `POST /api/admin/assign-conversation`

Auth:

- protected by `authMiddleware` + `requireRole(['admin','super_admin'])`

Payload:

- `conversationId`
- `teacherId` (nullable for unassign)
- `assignedBy`

### 8.3 Expected Firestore changes (invariants)

When assigned:

- `assignedTeacherId`, `assignedTeacherName`, `assignedTeacherPublicId`
- `assignedBy`, `assignedAt`
- `status` should reflect assigned/unassigned
- `authorizedUserIds` should include the assigned teacher so teacher clients can see it

When unassigned:

- assignedTeacher fields cleared
- status set to unassigned
- `authorizedUserIds` ideally removes teacher

---

## 9. Environment variables (important)

### 9.1 Backend `.env`

Expected keys:

- `FIREBASE_SERVICE_ACCOUNT_PATH` (path to service account JSON)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Backend uses this to initialize Firebase Admin SDK.

### 9.2 Frontend `.env.local`

Both frontends use:

- `NEXT_PUBLIC_API_URL` (backend base URL)
- Firebase web config keys (`NEXT_PUBLIC_FIREBASE_*`)

All frontend backend calls should use `config.API_BASE_URL` to avoid hardcoding.

---

## 10. Summary of major bug fixes

- Fixed `401 Unauthorized` caused by requests firing before Firebase auth token was ready.
- Removed server-only Firebase Admin SDK usage from frontend runtime paths.
- Standardized frontend API base URL usage via `config.API_BASE_URL`.
- Expanded teacher role permissions to manage questions/thoughts/answers (admin-like).
- Fixed answers admin pages crashing due to non-array API responses.
- Fixed question create/update payload mismatches (`text` vs `question`, `?id=` requirement).
