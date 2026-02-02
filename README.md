# IT Certification Simulator

Practice IT certification exams with realistic test environments.

<!-- ![Dashboard](docs/images/dashboard.png) -->

## Features

- **Exam Engine** - Timed exams with randomized questions and answers
- **Question Types** - Single choice, multiple choice, true/false
- **Anti-Cheating** - Tab switch detection, copy/paste prevention, time validation
- **Audit Logging** - Track login attempts, exam activity, and security events
- **Admin Dashboard** - Manage certifications, questions, and exams
- **Progress Tracking** - View exam history and scores

<!-- ![Exam Taking](docs/images/exam.png) -->

## Tech Stack

| Backend | Frontend |
|---------|----------|
| Bun + Elysia | Next.js 14 |
| PostgreSQL + Prisma | TypeScript |
| JWT Auth | Tailwind + ShadCN UI |

## Quick Start

```bash
# Backend
cd backend
bun install
cp .env.example .env  # Configure DATABASE_URL and JWT_SECRET
bun run db:push
bun run dev

# Frontend (new terminal)
cd frontend
bun install
bun run dev
```

Open http://localhost:3000

## Environment Variables

**Backend** (`backend/.env`)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/itcert"
JWT_SECRET="your-secret-key"
```

**Frontend** (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## User Roles

- **USER** - Take exams, view results
- **ADMIN** - Manage certifications, questions, exams, view audit logs

<!-- ![Admin Dashboard](docs/images/admin.png) -->

## API Docs

http://localhost:3001/swagger

## License

MIT
