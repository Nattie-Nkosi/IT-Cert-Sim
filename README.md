# IT Certification Simulator

A full-stack web application for practicing IT certification exams with realistic test environments and comprehensive question management.

## Features

- **User Authentication**: Secure JWT-based authentication with role-based access control
- **Certification Management**: Support for multiple IT certifications (CompTIA, Cisco, AWS, etc.)
- **Question Bank**: Comprehensive question management with multiple question types:
  - Single choice
  - Multiple choice
  - True/False
- **Exam Engine**: Timed exams with automatic scoring and detailed results
- **Admin Dashboard**: Upload and manage questions, create certifications, and build exams
- **Progress Tracking**: View exam history, scores, and performance analytics
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS and ShadCN UI

## Tech Stack

### Backend
- **Runtime**: Bun
- **Framework**: Elysia
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with bcryptjs

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **State Management**: Zustand
- **Data Fetching**: TanStack Query + Axios
- **Form Handling**: React Hook Form + Zod

## Quick Start

### Prerequisites

- Bun (v1.0.0+)
- PostgreSQL (v14+)
- Node.js (v18+) - for some tooling

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd it-cert-simulator
```

2. Follow the detailed setup guide in [SETUP.md](./SETUP.md)

3. Quick start commands:

```bash
# Backend
cd backend
bun install
cp .env.example .env
# Edit .env with your database credentials
bun run db:push
bun run dev

# Frontend (in a new terminal)
cd frontend
bun install
cp .env.local.example .env.local
bun run dev
```

4. Open http://localhost:3000 in your browser

## Project Structure

```
it-cert-simulator/
├── backend/           # Elysia backend API
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── middleware/ # Auth middleware
│   │   └── lib/      # Prisma client
│   └── prisma/       # Database schema
│
├── frontend/         # Next.js frontend
│   └── src/
│       ├── app/      # App Router pages
│       ├── components/ # React components
│       └── lib/      # Utilities, API, store
│
├── CLAUDE.md         # Development guide for Claude Code
└── SETUP.md          # Detailed setup instructions
```

## Key Commands

### Backend
```bash
bun run dev          # Start dev server
bun run db:push      # Push schema to database
bun run db:studio    # Open Prisma Studio
bun run db:migrate   # Create migration
```

### Frontend
```bash
bun run dev          # Start dev server
bun run build        # Build for production
bun run lint         # Run ESLint
```

## API Documentation

Once the backend is running, view the auto-generated API documentation at:
- http://localhost:3001/swagger

## Default Ports

- Backend API: http://localhost:3001
- Frontend: http://localhost:3000
- PostgreSQL: localhost:5432

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/itcert?schema=public"
JWT_SECRET="your-secret-key"
PORT=3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Database Schema

The application uses the following main models:
- **User**: User accounts with authentication
- **Certification**: IT certifications (A+, Network+, etc.)
- **Question**: Exam questions with difficulty levels
- **Answer**: Possible answers for questions
- **Exam**: Exam configurations
- **ExamAttempt**: User exam attempts and scores

See `backend/prisma/schema.prisma` for the complete schema.

## User Roles

- **USER**: Regular users who can take exams and view their results
- **ADMIN**: Administrators who can create certifications, upload questions, and manage exams

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Development Guide

For detailed development instructions and architecture information, see [CLAUDE.md](./CLAUDE.md)

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check [SETUP.md](./SETUP.md) for setup troubleshooting
- Review API documentation at /swagger
- Check backend logs for API errors
- Review browser console for frontend issues

## Roadmap

- [ ] Question tagging and filtering
- [ ] Study mode with explanations
- [ ] Performance analytics dashboard
- [ ] Social features (leaderboards, sharing)
- [ ] Mobile app
- [ ] Question marketplace
- [ ] AI-generated practice questions
- [ ] Video explanations
- [ ] Flashcard mode
- [ ] Spaced repetition learning

## Authors

Built with Claude Code

---

**Note**: This is a practice application for educational purposes. Ensure you have proper licensing for any exam content you upload.
