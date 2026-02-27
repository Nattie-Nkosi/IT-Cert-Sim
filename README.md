# IT Certification Simulator

Practice IT certification exams in realistic, timed test environments. Supports both exam and practice modes with detailed analytics.

![Homepage](docs/images/homepage.png)

## Features

### Exam Engine
- **Timed Exam Mode** — Countdown timer, auto-submit on expiry, question shuffling per attempt
- **Practice Mode** — No timer, instant answer feedback with explanations, free navigation
- **Question Types** — Single choice, multiple choice, true/false
- **Answer Randomization** — Answers shuffled on every attempt

### Security & Anti-Cheating
- Tab switch detection (flags attempt after 3+ switches in exam mode)
- Time validation on submission
- IP address and user agent logging
- Login attempt tracking with 15-minute lockout after 5 failures

### Admin Dashboard
- Create and manage certifications, exams, and questions
- Upload questions individually or in bulk
- Attach exhibit images to questions (Cloudinary)
- View audit logs with filtering by user, action, and date
- Review flagged exam attempts

### Progress & Analytics
- Score trends over last 20 attempts (line chart)
- Pass/fail breakdown (pie chart)
- Exam vs. practice mode comparison (bar chart)
- Full exam history with filtering, sorting, and pagination
- Per-attempt result review with correct answers and explanations

### Desktop App
- Native Windows/macOS/Linux app via Tauri 2

---

## Screenshots

| Dashboard | Certifications |
|-----------|---------------|
| ![Dashboard](docs/images/dashboard.png) | ![Certifications](docs/images/cert_page.png) |

| Exams | Add Questions |
|-------|--------------|
| ![Exams](docs/images/axams-page.png) | ![Add Questions](docs/images/add-questions.png) |

| Certification Management | Audit Logs |
|--------------------------|-----------|
| ![Cert Management](docs/images/certification-management.png) | ![Audit Logs](docs/images/audit-logs-page.png) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Backend | Elysia framework |
| Database | PostgreSQL + Prisma ORM |
| Authentication | JWT (15m access token + 7d refresh token) |
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + ShadCN UI |
| State | Zustand + TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Notifications | Sonner |
| Image Uploads | Cloudinary |
| Desktop | Tauri 2 + Rust |

---

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) v1.0+
- PostgreSQL running locally
- Node.js 18+ (for some tooling)

### Web App

```bash
# 1. Backend
cd backend
bun install
cp .env.example .env        # Edit DATABASE_URL and JWT_SECRET
bun run db:push
bun run db:seed             # Optional: seed sample data
bun run dev                 # Starts on http://localhost:3001

# 2. Frontend (new terminal)
cd frontend
bun install
bun run dev                 # Starts on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000)

### Desktop App

```bash
# Windows
.\start-desktop.bat

# PowerShell
.\start-desktop.ps1
```

Starts backend, frontend, and launches the native desktop app.

---

## Environment Variables

**Backend** — `backend/.env`

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/itcert"
JWT_SECRET="your-secret-key-min-32-chars"
PORT=3001

# Optional: image uploads
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Frontend** — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Project Structure

```
it-cert-simulator/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Elysia server entry
│   │   ├── lib/
│   │   │   ├── prisma.ts         # Prisma client singleton
│   │   │   ├── auditLog.ts       # Audit logging helpers
│   │   │   └── cloudinary.ts     # Image upload service
│   │   ├── middleware/
│   │   │   └── auth.ts           # JWT + admin middleware
│   │   └── routes/
│   │       ├── auth.ts           # Register / login / refresh
│   │       ├── certifications.ts # Browse certifications
│   │       ├── questions.ts      # Question retrieval
│   │       ├── exams.ts          # Exam flow (start, submit, feedback)
│   │       └── admin.ts          # Admin management endpoints
│   └── prisma/
│       └── schema.prisma
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/           # Login, register
│       │   ├── (dashboard)/      # Dashboard, certs, exams, history
│       │   └── (admin)/          # Admin pages
│       ├── components/           # Shared UI components
│       ├── lib/
│       │   ├── api.ts            # Axios instance with JWT interceptor
│       │   └── store.ts          # Zustand auth store
│       └── types/
│           └── exam.ts           # TypeScript interfaces
│
└── desktop/                      # Tauri desktop wrapper
```

---

## User Roles

| Role | Permissions |
|------|-------------|
| `USER` | Take exams and practice tests, view personal results and history |
| `ADMIN` | All user permissions + manage certifications, questions, exams; view audit logs and flagged attempts |

Default admin credentials are set during database seeding.

---

## API

Interactive API docs (Swagger UI) are available at:

```
http://localhost:3001/swagger
```

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login and receive tokens |
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/certifications` | List all certifications |
| GET | `/api/exams` | List all exams |
| POST | `/api/exams/:id/start` | Start exam (`?mode=EXAM\|PRACTICE`) |
| POST | `/api/exams/:id/submit` | Submit exam answers |
| POST | `/api/exams/attempts/:id/check-answer` | Get instant feedback (practice mode) |
| GET | `/api/exams/attempts/my` | Get current user's attempt history |
| POST | `/api/admin/questions` | Create a question (admin) |
| POST | `/api/admin/questions/bulk` | Bulk import questions (admin) |

---

## Development Commands

### Backend (`backend/`)

```bash
bun run dev           # Start dev server with hot reload
bun run db:push       # Push schema changes to database
bun run db:migrate    # Create and apply migrations
bun run db:seed       # Seed sample data
bun run db:studio     # Open Prisma Studio
bunx prisma generate  # Regenerate Prisma client
```

### Frontend (`frontend/`)

```bash
bun run dev           # Start Next.js dev server
bun run build         # Production build
bun run lint          # Run ESLint
bunx shadcn@latest add <component>  # Add ShadCN component
```

---

## License

MIT
