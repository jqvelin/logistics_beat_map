## 📌 Project Overview

This project is a **gamified mobile learning platform for logistics students**, similar to Duolingo, but focused on professional terminology, real-world simulations, and career-oriented training.

The goal of the system is to:

- Increase student engagement
- Improve understanding of logistics concepts
- Provide interactive and practical learning

Target audience of the app speaks Russian, so everything related to the interface should be in Russian as well!

## 🧱 High-Level Architecture

The system follows a **simple client-server architecture**:

- Mobile App (Expo / React Native)
- Backend API (NestJS)
- Database (PostgreSQL)

Communication:

- Mobile ↔ Backend: HTTPS (REST API)
- Backend ↔ Database: Prisma ORM

---

## 📱 Mobile Application (Frontend)

### Responsibilities

- Display UI (lessons, tasks, progress)
- Handle user input
- Send requests to backend
- Store auth token (JWT)

### Constraints

- No business logic
- No direct database access

### Key Features

- Lesson screen
- Task interaction (quiz, simulation)
- Progress tracking
- Daily tasks
- Notifications (future)

---

## 🧠 Backend (NestJS)

### Responsibilities

- Business logic
- Authentication & authorization
- Task validation
- Progress calculation
- API layer

### Architecture Style

- Modular (feature-based)
- Clean separation: controller → service → repository

---

## 🗄️ Database (PostgreSQL)

### Responsibilities

- Persistent storage

### Stores

- Users
- Content (courses, lessons, tasks)
- Progress
- Gamification data

---

## 🧩 Core Modules (Backend)

### 1. Auth Module

Handles:

- Registration
- Login
- JWT tokens

Entities:

- User

---

### 2. User Module

Handles:

- User profile
- Stats (XP, level, streak)

---

### 3. Content Module

Acts as internal CMS.

Entities:

- Course
- Module
- Lesson
- Task

Task format (JSON-based):

```
{
  "type": "quiz",
  "question": "...",
  "options": [...],
  "answer": 1
}
```

---

### 4. Learning Module

Core logic of the app.

Responsibilities:

- Get next task
- Track progress
- Manage lesson flow

Key function:

```
getNextTask(userId)
```

---

### 5. Gamification Module

Handles:

- XP
- Levels
- Streaks

Triggered by events:

- Task completed

---

### 6. Simulation Module

Handles real-world logistics scenarios.

Responsibilities:

- Evaluate decisions
- Return score and feedback

---

### 7. Progress Module

Tracks:

- Completed tasks
- Lesson completion
- User history

---

## 🔗 API Design

Style: REST

### Example Endpoints

- POST /auth/register
- POST /auth/login
- GET /learning/next-task
- POST /learning/complete-task
- GET /user/profile

---

## 📊 Data Model (Simplified)

### User

- id
- email
- password
- xp
- level
- streak

### Course

- id
- title

### Lesson

- id
- courseId
- title

### Task

- id
- lessonId
- type
- content (JSON)

### Progress

- id
- userId
- taskId
- completed

---

## 🔐 Security

- HTTPS
- JWT authentication
- Password hashing (bcrypt)
- Input validation

---

## ⚙️ Technologies

### Frontend

- Expo (React Native)

### Backend

- NestJS
- TypeScript

### Database

- PostgreSQL
- Prisma ORM

---

## 🚀 Development Phases

### Phase 1 (MVP)

- Auth
- Content system
- Task completion
- XP system

### Phase 2

- Learning engine
- Daily tasks

### Phase 3

- Simulation
- AI-generated content

---

## ⚠️ Important Rules

- Business logic must be in backend only
- Frontend is a thin client
- Content must not be hardcoded
- System must be modular

---

## 🎯 Goal of the System

Create a scalable, modular, AI-friendly educational platform that combines:

- Learning
- Gamification
- Simulation

---
