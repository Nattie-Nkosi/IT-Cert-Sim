# IT Certification Simulator - Setup Guide

This guide will walk you through setting up the IT Certification Simulator application from scratch.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

1. **Bun** (v1.0.0 or higher) - JavaScript runtime and package manager
   - Install from: https://bun.sh/
   - Run: `curl -fsSL https://bun.sh/install | bash` (macOS/Linux)
   - Or: `powershell -c "irm bun.sh/install.ps1|iex"` (Windows)

2. **PostgreSQL** (v14 or higher) - Database
   - Install from: https://www.postgresql.org/download/
   - Or use Docker: `docker run --name itcert-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

3. **Git** - Version control
   - Install from: https://git-scm.com/downloads

## Installation Steps

### Step 1: Navigate to Project Directory

```bash
cd it-cert-simulator
```

### Step 2: Install Backend Dependencies

```bash
cd backend
bun install
```

This will install all backend dependencies including:
- Elysia (web framework)
- Prisma (ORM)
- bcryptjs (password hashing)
- JWT libraries
- And more...

### Step 3: Configure Backend Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Then edit `backend/.env` with your configuration:

```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/itcert?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=3001
NODE_ENV="development"
```

**Important:** Replace the DATABASE_URL with your actual PostgreSQL credentials.

### Step 4: Setup Database

```bash
# Generate Prisma client
bun run db:generate

# Push the database schema (creates tables)
bun run db:push
```

This will create all the necessary tables in your PostgreSQL database based on the Prisma schema.

### Step 5: Install Frontend Dependencies

```bash
cd ../frontend
bun install
```

This will install all frontend dependencies including:
- Next.js (React framework)
- Tailwind CSS (styling)
- TanStack Query (data fetching)
- Zustand (state management)
- React Hook Form & Zod (form handling)
- Axios (HTTP client)
- And more...

### Step 6: Configure Frontend Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local
```

The default configuration should work if your backend is running on port 3001:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Step 7: Install ShadCN UI Components

The project uses ShadCN UI for components. You'll need to add components as needed:

```bash
# Initialize ShadCN (if not already done)
bunx shadcn@latest init

# Add required components
bunx shadcn@latest add button
bunx shadcn@latest add card
bunx shadcn@latest add input
bunx shadcn@latest add textarea
bunx shadcn@latest add select
bunx shadcn@latest add dialog
bunx shadcn@latest add label
```

Note: When running `shadcn init`, use these settings:
- Style: Default
- Base color: Slate
- CSS variables: Yes

## Running the Application

### Option 1: Run Backend and Frontend Separately

**Terminal 1 - Backend:**
```bash
cd backend
bun run dev
```

The backend will start at: http://localhost:3001
API documentation (Swagger) will be available at: http://localhost:3001/swagger

**Terminal 2 - Frontend:**
```bash
cd frontend
bun run dev
```

The frontend will start at: http://localhost:3000

### Option 2: Using a Process Manager (Recommended)

You can use tools like `concurrently` or `pm2` to run both simultaneously. Or create a simple script.

## Verification

1. Open your browser and go to: http://localhost:3000
2. You should see the IT Certification Simulator home page
3. Try registering a new account
4. Check the backend logs to ensure API calls are working
5. Visit http://localhost:3001/swagger to see the API documentation

## Creating an Admin User

By default, users are created with the USER role. To create an admin user, you'll need to manually update the database:

```bash
cd backend
bun run db:studio
```

This opens Prisma Studio in your browser. Navigate to the `users` table and change the `role` field from `USER` to `ADMIN` for your account.

## Database Management

Useful commands for managing your database:

```bash
cd backend

# Open Prisma Studio (visual database editor)
bun run db:studio

# Create a new migration (after schema changes)
bun run db:migrate

# Reset database (WARNING: deletes all data)
bunx prisma migrate reset

# Seed database with sample data (if seed script exists)
bun run db:seed
```

## Troubleshooting

### Backend won't start

- Check that PostgreSQL is running
- Verify DATABASE_URL in `.env` is correct
- Ensure port 3001 is not already in use

### Frontend won't start

- Ensure backend is running first
- Check NEXT_PUBLIC_API_URL in `.env.local`
- Clear Next.js cache: `rm -rf .next`

### Database connection errors

- Verify PostgreSQL is running: `psql -U postgres`
- Check if the database exists: `psql -U postgres -l`
- Create database if needed: `createdb itcert`

### Prisma errors

- Regenerate Prisma client: `bun run db:generate`
- Check schema syntax in `prisma/schema.prisma`

## Next Steps

After successful setup:

1. **Create a Certification**: Use the admin API endpoint to create your first certification
2. **Upload Questions**: Use the `/admin/upload` page to add questions
3. **Create Exams**: Build exams from your question pool
4. **Test the System**: Take a practice exam and verify scoring

## Development Workflow

1. Make changes to backend code - server auto-restarts
2. Make changes to frontend code - hot module reloading
3. Modify Prisma schema - run `bun run db:push` or `bun run db:migrate`
4. Add new routes - update CLAUDE.md documentation

## Production Deployment

Before deploying to production:

1. Change JWT_SECRET to a strong random value
2. Use a production PostgreSQL database
3. Set NODE_ENV=production
4. Build frontend: `bun run build`
5. Use a process manager (PM2) or container orchestration
6. Set up proper CORS policies
7. Enable HTTPS/SSL
8. Configure proper logging and monitoring

## Additional Resources

- [Elysia Documentation](https://elysiajs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Bun Documentation](https://bun.sh/docs)
- [ShadCN UI](https://ui.shadcn.com/)

## Support

If you encounter issues not covered in this guide, check:
- Backend logs in the terminal
- Browser console for frontend errors
- Prisma Studio for database state
- API documentation at /swagger
