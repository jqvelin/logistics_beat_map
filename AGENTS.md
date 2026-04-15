## 📌 Project Overview

This project is a **gamified mobile learning platform for logistics students**, similar to Duolingo, but focused on professional terminology, real-world simulations, and career-oriented training.

The goal of the system is to:

- Increase student engagement
- Improve understanding of logistics concepts
- Provide interactive and practical learning

Target audience of the app speaks Russian, so everything related to the interface should be in Russian as well!

## Stack and repositories

| Layer    | Technology                                                                     | Notes                                                                                                 |
| -------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Mobile   | Expo SDK ~54, React 19, React Native 0.81, **expo-router** (file-based routes) | Entry: `expo-router/entry`; root layout wires auth and navigation.                                    |
| API      | NestJS 11, TypeScript                                                          | Global prefix `api`; validation via `class-validator` / `ValidationPipe`.                             |
| DB       | PostgreSQL + **Prisma 6**                                                      | `schema.prisma` defines models; `PrismaService` extends `PrismaClient` with connect/disconnect hooks. |
| Auth     | JWT (`@nestjs/jwt`, `passport-jwt`)                                            | Bearer token; payload includes `sub` (user id) and `email`.                                           |
| API docs | Swagger (`@nestjs/swagger`)                                                    | UI at `/api/docs`; OpenAPI JSON written to `backend/openapi.json` on bootstrap.                       |

Environment:

- **Backend**: `DATABASE_URL`, `JWT_SECRET`, optional `JWT_EXPIRES_IN` (default `7d`), `PORT` (default `6767` in `main.ts`).
- **Mobile**: `EXPO_PUBLIC_API_URL` — must include the `/api` prefix if the server uses the global prefix (e.g. `http://<host>:6767/api`). Fallback in code is `http://localhost:3000/api` (`mobile/lib/env.ts`).

---

## Monorepo layout

```
logistics_beat_map/
├── backend/          # NestJS API
│   ├── prisma/       # schema.prisma, seed.ts
│   └── src/
│       ├── auth/
│       ├── courses/
│       ├── learning/
│       ├── users/
│       ├── prisma/
│       └── common/
└── mobile/           # Expo app
    ├── app/          # expo-router screens
    └── lib/          # api client, auth, types, storage
```

---

## Backend architecture

### Module graph

`AppModule` imports, in order: `PrismaModule`, `AuthModule`, `UsersModule`, `CoursesModule`, `LearningModule`.

There is **no separate “repository” layer** in code: feature services inject `PrismaService` and run Prisma queries directly. The intended split is still **controller → service → database (Prisma)**.

### Cross-cutting behavior (`main.ts`)

- **`api` global prefix** — all controllers are mounted under `/api/...`.
- **CORS** enabled globally.
- **`ValidationPipe`**: `whitelist`, `transform`, `forbidNonWhitelisted` — DTOs must use decorators; unknown fields are rejected.
- **Swagger** document built at startup and persisted to `openapi.json` in the backend working directory.

### Prisma module

- `PrismaModule` is `@Global()` (see `prisma.module.ts`); `PrismaService` is the shared DB accessor.
- Lifecycle: `$connect` on module init, `$disconnect` on destroy.

### Auth module

| Piece            | Role                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthController` | `POST /api/auth/register`, `POST /api/auth/login` — public.                                                                            |
| `AuthService`    | Email normalized to lowercase; bcrypt hash (cost 10) on register; `ConflictException` / `UnauthorizedException` with Russian messages. |
| `JwtModule`      | Signs tokens with `JWT_SECRET`; `expiresIn` from env or `7d`.                                                                          |
| `JwtStrategy`    | `ExtractJwt.fromAuthHeaderAsBearerToken()`; validates payload; **throws at startup** if `JWT_SECRET` is missing.                       |
| `JwtAuthGuard`   | Passport `'jwt'` guard used on protected routes.                                                                                       |

Successful auth responses return `{ accessToken, user }` where `user` omits `password` (built in `buildAuthResponse`).

### Users module

- `GET /api/users/me` — protected by `JwtAuthGuard`.
- `UsersService.getMe` selects id, email, gamification fields, timestamps — **no password**.

`CurrentUser` decorator (`common/decorators/current-user.decorator.ts`) reads `request.user` populated by Passport (shape `{ sub, email }`). Handlers use `user.sub` as the canonical user id.

### Courses module (content read API)

`CoursesController` is registered at the **root** of the app (no `@Controller('courses')` on the class — routes are declared on methods):

- `GET /api/courses` — list courses with modules and `_count.lessons`.
- `GET /api/courses/:id` — full tree: course → modules → lessons → tasks.
- `GET /api/lessons/:id` — single lesson with module metadata and tasks.
- `GET /api/tasks/:id` — single task with lesson context.

These endpoints are **not** guarded by JWT in the current code — the catalog and task payloads are intended for clients; **quiz answers are still stripped** (see below).

### Learning module

`LearningController` uses `@Controller('learning')` + `@UseGuards(JwtAuthGuard)` for all actions:

| Method | Path                          | Behavior                                                                                                                                                                                                               |
| ------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/learning/progress`      | Aggregated progress: per course/module/lesson task counts, completion flags, `completedTaskIds`, “today” stats (UTC day boundary via `toDayNumber`), `xpGainedToday` derived from completed tasks today × constant XP. |
| GET    | `/api/learning/next-task`     | First task (by `Task.createdAt` asc) with **no** `Progress` row where `completed: true` for this user. Returns `{ message, task: null }` when none.                                                                    |
| POST   | `/api/learning/complete-task` | Body: `CompleteTaskDto` (`taskId`, optional `selectedOptionIndex` 0–2).                                                                                                                                                |

**`LearningService`** is the main place for **learning + gamification** logic today (there is no separate Gamification module):

- **`XP_PER_TASK`**: fixed XP per newly completed task (duplicate completion awards 0 XP).
- **`completeTask`**: loads task; for `type === 'quiz'`, requires `selectedOptionIndex` and compares to `content.answer` on the stored JSON; wrong answer → `BadRequestException`. Non-quiz types skip that check.
- **`Progress`**: `upsert` on unique `(userId, taskId)`; sets `completed: true` and `completedAt`.
- **Level**: `level = max(1, floor(xp / 100) + 1)` after applying XP (see `updateGamification`).
- **Streak**: compares UTC calendar days between previous completion (`findFirst` ordered by `completedAt` desc, strictly before current) and current; increments on consecutive days, resets to 1 on gaps, unchanged if same day.

**Sanitization**: `sanitizeTask` / `sanitizeTaskContent` remove the `answer` field from quiz JSON when returning tasks to the client (used in learning and courses services).

### DTOs

- `CompleteTaskDto`: `taskId` string; `selectedOptionIndex` optional int 0–2 (`class-validator`).

### App controller

- `GET /api/health` — returns the string from `AppService.getHealth()` (simple liveness check).

---

## Data model (Prisma)

Key models in `prisma/schema.prisma`:

- **User**: `id` (cuid), `email` unique, `password`, `xp`, `level`, `streak`, timestamps; relation `progress[]`.
- **Course** → **Module** → **Lesson** → **Task**: nested ownership; `onDelete: Cascade` on child FKs.
- **Task**: `type` string, `content` **Json** — flexible schema (quiz vs simulation, etc.).
- **Progress**: `userId` + `taskId` **@@unique**; `completed`, `completedAt`; indexes on `userId` and `taskId`.

Indexes on `moduleId`, `lessonId`, `courseId` where appropriate for list queries.

---

## Task content contract

**Quiz** (stored and partially typed in backend services):

```json
{
  "type": "quiz",
  "question": "…",
  "options": ["…", "…", "…"],
  "answer": 0
}
```

`answer` is never sent to the client after sanitization. Client submits `selectedOptionIndex` (validated 0–2 to match three options in seed).

**Simulation** (seed and mobile types): `type: "simulation"`, `scenario`, `steps[]` — completion path does not validate answers in `LearningService` for non-quiz types (extensible for future server-side checks).

---

## Mobile application

### Routing (expo-router)

- `app/_layout.tsx`: wraps app in `AuthProvider` and `ThemeProvider`; `RootNavigator` redirects unauthenticated users to `/auth` and authenticated users away from `/auth` to `/(tabs)`.
- Tab screens under `app/(tabs)/` (home, courses, progress, profile, etc.).
- Stack screens: `lessons/[lessonId]`, `courses/[courseId]`, `practice`.

### Client API layer (`lib/api.ts`)

- Single `request()` helper: `fetch(`${env.apiUrl}${path}`)`, JSON body, optional `Authorization: Bearer`.
- Errors: throws `ApiError` with HTTP status; message from JSON `message` when present.
- Typed responses aligned with `lib/types.ts` (`User`, `CourseDetail`, `ProgressResponse`, `NextTaskResponse`, etc.).

### Auth (`lib/auth-context.tsx` + `lib/storage.ts`)

- Token stored in **Expo SecureStore** (`accessToken` key).
- On load: read token → `GET /users/me` → if failure, clear token and treat as logged out.
- `login` / `register` store token and set user from auth response.

### Domain rules on the client

- UI strings for users should be **Russian** (per product rules).
- Business rules (XP, correctness, streaks) are **enforced on the server**; the app is a thin client but may mirror UX hints from API responses (`awardedXp`, progress aggregates).

---

## API summary (effective paths)

All prefixed with `/api`:

| Area     | Examples                                                                                  |
| -------- | ----------------------------------------------------------------------------------------- |
| Auth     | `POST /auth/register`, `POST /auth/login`                                                 |
| Users    | `GET /users/me` (JWT)                                                                     |
| Content  | `GET /courses`, `GET /courses/:id`, `GET /lessons/:id`, `GET /tasks/:id`                  |
| Learning | `GET /learning/progress`, `GET /learning/next-task`, `POST /learning/complete-task` (JWT) |

---

## Seed and content

- `backend/prisma/seed.ts` defines structured course/module/lesson/task data (Russian copy).
- Run via `npm run prisma:seed` from `backend` (see `package.json` `prisma.seed`).

---

## Gaps vs. high-level `AGENTS.md`

The roadmap in `AGENTS.md` mentions separate Simulation / Gamification / Progress modules and daily tasks. **As implemented:**

- Gamification and progress aggregation live inside **`LearningService`** (and Prisma `User` / `Progress`).
- Simulation tasks exist in content and types; **server validation** for simulation completion is not implemented like quiz.
- “Daily tasks” as a product feature may be partially reflected by `tasksCompletedToday` / `xpGainedToday` in progress, not a separate Daily Tasks subsystem.
