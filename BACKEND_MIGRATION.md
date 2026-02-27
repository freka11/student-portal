# Backend API Migration Guide

The Next.js API routes in **student-admin** and **student-user** have been consolidated into a single Express backend in `backend/`. Both frontend apps now call this shared backend instead of their own `/api/*` routes.

## Architecture

```
student-admin (Next.js)  ─┐
                         ├──► backend (Express :4000) ──► Firestore
student-user (Next.js)   ─┘
```

## Backend API Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/session` | Validate Bearer token, return user (uid, email, name, role, publicId) |
| GET | `/session` | Same as POST (requires Bearer token) |
| GET | `/me` | Same as above |

### Admin (`/api/admin`) — requires Bearer token + role in [admin, super_admin, teacher]
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Today's thought + questions |
| GET | `/thoughts` | List thoughts (?date=all for all) |
| POST | `/thoughts` | Create thought (body: `thought` or `text`) |
| PUT | `/thoughts/:id` | Update thought (body: `text`) |
| DELETE | `/thoughts/:id` | Soft-delete thought |
| GET | `/questions` | List questions (?date=all) |
| POST | `/questions` | Create question (body: `question` or `text`, `status`) |
| PUT | `/questions/:id` | Update question (body: `text`, optional `status`) |
| PATCH | `/questions/:id/status` | Update status (body: `status`: draft \| published) |
| DELETE | `/questions/:id` | Soft-delete question |
| GET | `/answers` | List all answers |
| DELETE | `/answers` or `/answers/:id` | Delete answer (id in path or ?id=) |

### Student (`/api/student`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/thoughts` | Public | List thoughts (?date=all) |
| GET | `/questions` | Public | List published questions (?date=all) |
| GET | `/answers` | Student | Own answers (?all=true for all students) |
| POST | `/answers` | Student | Submit answer (body: `questionId`, `answer`, optional `publishDate`) |
| GET | `/streak` | Student | Get streak count and lastAnsweredDate |

## Setup

### 1. Backend
- Uses `backend/src/config/serviceacount.json` (Firebase Admin SDK)
- Run: `cd backend && npm run dev`
- Listens on `http://localhost:4000`

### 2. Frontend
- Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` in both apps' `.env.local`
- Default is `http://localhost:4000` if not set
- Auth: Both apps send `Authorization: Bearer <firebase-id-token>` with each request

### 3. CORS
- Backend allows `http://localhost:3000` and `http://localhost:3001` by default
- Override with `CORS_ORIGIN` env (comma-separated)

## What Was Removed
The following Next.js API routes are **no longer used** by the frontend. They can be deleted once you confirm everything works:
- `student-admin/src/app/api/thoughts/`
- `student-admin/src/app/api/questions/`
- `student-admin/src/app/api/answers/`
- `student-admin/src/app/api/auth/session/`
- `student-user/src/app/api/thoughts/`
- `student-user/src/app/api/questions/`
- `student-user/src/app/api/answers/`
- `student-user/src/app/api/streak/`
- `student-user/src/app/api/auth/session/`

Note: Other admin APIs (assign-conversation, create-teacher, list-users, etc.) were not migrated. They remain in student-admin and can be migrated separately if needed.
