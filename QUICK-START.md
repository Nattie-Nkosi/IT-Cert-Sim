# Quick Start Guide

## What's Been Created

Your IT Certification Simulator project structure is now complete with:

✅ **Backend** (Bun + Elysia + Prisma + PostgreSQL)
- Complete API with authentication
- Admin routes for question/certification management
- User routes for taking exams
- JWT-based authentication with bcrypt password hashing

✅ **Frontend** (Next.js + TypeScript + Tailwind + ShadCN)
- Authentication pages (login/register)
- Admin dashboard for uploading questions
- Home page with navigation
- API client with automatic token handling
- State management with Zustand

✅ **Documentation**
- CLAUDE.md - Architecture and development guide
- SETUP.md - Detailed setup instructions
- INSTALL.md - Step-by-step installation guide
- README.md - Project overview

## What You Need to Install (In Order)

### 1. Install Bun
```bash
# Windows
powershell -c "irm bun.sh/install.ps1|iex"

# macOS/Linux
curl -fsSL https://bun.sh/install | bash
```

### 2. Install PostgreSQL
Choose one:
- **Option A**: Download from https://www.postgresql.org/download/
- **Option B (Docker)**: `docker run --name itcert-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=itcert -p 5432:5432 -d postgres`

### 3. Install Backend Dependencies
```bash
cd backend
bun install
```

### 4. Configure Backend
```bash
# Copy environment file
cp .env.example .env

# Edit .env and update DATABASE_URL with your PostgreSQL credentials
```

### 5. Setup Database
```bash
cd backend
bun run db:generate
bun run db:push
```

### 6. Install Frontend Dependencies
```bash
cd frontend
bun install
```

### 7. Install ShadCN Components
```bash
cd frontend
bunx shadcn@latest init
# Accept defaults: Default style, Slate color, Yes to CSS variables

bunx shadcn@latest add button card input textarea label
```

### 8. Configure Frontend
```bash
cd frontend
cp .env.local.example .env.local
# Defaults should work, but verify NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
bun run dev
```
Server starts at: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
bun run dev
```
App starts at: http://localhost:3000

## First Time Setup

1. Open http://localhost:3000
2. Click "Register" and create an account
3. To make yourself an admin:
   ```bash
   cd backend
   bun run db:studio
   ```
4. In Prisma Studio (opens in browser):
   - Go to `users` table
   - Change your user's `role` from `USER` to `ADMIN`
5. Log out and log back in

## Project Structure

```
it-cert-simulator/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Main server entry
│   │   ├── routes/               # API endpoints
│   │   │   ├── auth.ts          # Login/Register
│   │   │   ├── admin.ts         # Admin-only routes
│   │   │   ├── certifications.ts
│   │   │   ├── exams.ts
│   │   │   └── questions.ts
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT authentication
│   │   └── lib/
│   │       └── prisma.ts        # Database client
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── .env                      # Your config (not in git)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Login/Register pages
│   │   │   ├── (admin)/         # Admin pages
│   │   │   ├── layout.tsx       # Root layout
│   │   │   └── page.tsx         # Home page
│   │   ├── components/
│   │   │   └── ui/              # ShadCN components
│   │   └── lib/
│   │       ├── api.ts           # Axios client
│   │       ├── store.ts         # Zustand auth store
│   │       └── utils.ts         # Utilities
│   ├── .env.local                # Your config (not in git)
│   └── package.json
│
├── CLAUDE.md                     # For future AI development
├── README.md                     # Project overview
├── SETUP.md                      # Detailed setup guide
├── INSTALL.md                    # Installation steps
└── QUICK-START.md               # This file
```

## Key API Endpoints

### Public Routes
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/certifications` - List certifications
- `GET /api/exams` - List exams

### Protected Routes (Requires JWT token)
- `POST /api/exams/:id/submit` - Submit exam answers
- `GET /api/exams/attempts/my` - Get my exam history

### Admin Routes (Requires ADMIN role)
- `POST /api/admin/certifications` - Create certification
- `POST /api/admin/questions` - Create question
- `POST /api/admin/questions/bulk` - Bulk upload questions
- `POST /api/admin/exams` - Create exam

View full API docs at: http://localhost:3001/swagger

## Useful Commands

### Backend
```bash
bun run dev          # Start dev server
bun run db:push      # Update database schema
bun run db:studio    # Open database GUI
bun run db:migrate   # Create migration
bun run db:generate  # Regenerate Prisma client
```

### Frontend
```bash
bun run dev          # Start dev server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run linter
```

## Testing the Full Workflow

1. **Create a Certification** (as admin via API or Prisma Studio)
   ```bash
   # Using curl
   curl -X POST http://localhost:3001/api/admin/certifications \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"CompTIA A+","code":"APLUS","vendor":"CompTIA","description":"Entry-level IT certification"}'
   ```

2. **Upload Questions**
   - Go to http://localhost:3000/admin/upload
   - Fill in the certification ID
   - Add question text and answers
   - Mark correct answers
   - Submit

3. **Create an Exam** (via API)
   - Use the certification ID and question IDs
   - Set duration and passing score

4. **Take the Exam**
   - Browse available exams
   - Start the exam
   - Answer questions
   - Submit and view results

## Troubleshooting

**Backend won't start:**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Run `bun run db:generate`

**Frontend won't start:**
- Check backend is running
- Run `bun install` again
- Delete .next folder: `rm -rf .next`

**Authentication errors:**
- Check JWT_SECRET is set in backend/.env
- Clear browser localStorage
- Check browser console for errors

**Database errors:**
- Run `bun run db:push` again
- Check PostgreSQL connection
- Use Prisma Studio to inspect data

## Next Steps

1. Read **CLAUDE.md** for architecture details
2. Read **SETUP.md** for advanced configuration
3. Customize the UI components
4. Add more features from the roadmap
5. Deploy to production

## Resources

- [Bun Docs](https://bun.sh/docs)
- [Elysia Docs](https://elysiajs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [ShadCN UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

For detailed guides, see:
- **INSTALL.md** - Step-by-step installation
- **SETUP.md** - Comprehensive setup guide
- **CLAUDE.md** - Development and architecture guide
