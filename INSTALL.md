# Installation Guide - Quick Start

Follow these steps to get your IT Certification Simulator up and running.

## Step 1: Install Prerequisites

### 1.1 Install Bun (JavaScript Runtime)

**Windows:**
```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

Verify installation:
```bash
bun --version
```

### 1.2 Install PostgreSQL (Database)

**Option A: Install PostgreSQL directly**
- Download from: https://www.postgresql.org/download/
- Follow the installer instructions
- Remember your PostgreSQL username and password

**Option B: Use Docker (Recommended for development)**
```bash
docker run --name itcert-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=itcert -p 5432:5432 -d postgres
```

## Step 2: Install Backend Dependencies

Open a terminal in the project directory:

```bash
cd backend
bun install
```

This will install:
- Elysia (web framework)
- Prisma (database ORM)
- JWT authentication libraries
- bcryptjs (password hashing)
- All other backend dependencies

## Step 3: Configure Backend Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `backend/.env` with your database credentials:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/itcert?schema=public"
JWT_SECRET="change-this-to-a-random-secret-key"
PORT=3001
NODE_ENV="development"
```

**Important Notes:**
- Replace `postgres:password` with your PostgreSQL username and password
- Change the JWT_SECRET to a random string for security
- If using Docker with the command above, the defaults will work

## Step 4: Setup Database Schema

Still in the `backend` directory:

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database (creates all tables)
bun run db:push
```

You should see output confirming tables were created.

## Step 5: Install Frontend Dependencies

Open a new terminal (keep backend terminal open):

```bash
cd frontend
bun install
```

This will install:
- Next.js and React
- Tailwind CSS
- TanStack Query
- Zustand (state management)
- ShadCN UI components
- React Hook Form & Zod
- All other frontend dependencies

## Step 6: Install ShadCN UI Components

The project needs some ShadCN UI components. Install them:

```bash
# Initialize ShadCN (answer prompts with defaults)
bunx shadcn@latest init

# When prompted:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Add required components
bunx shadcn@latest add button
bunx shadcn@latest add card
bunx shadcn@latest add input
bunx shadcn@latest add textarea
bunx shadcn@latest add label
```

## Step 7: Configure Frontend Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local
```

The default configuration should work:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Step 8: Run the Application

### Terminal 1 - Start Backend

```bash
cd backend
bun run dev
```

You should see:
```
🦊 Server is running at localhost:3001
```

### Terminal 2 - Start Frontend

```bash
cd frontend
bun run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

## Step 9: Test the Application

1. Open your browser to: **http://localhost:3000**
2. You should see the IT Certification Simulator home page
3. Click "Register" to create an account
4. Fill out the registration form and submit
5. You should be redirected to the dashboard

## Step 10: Create an Admin User (Optional)

To upload questions and manage certifications, you need an admin account:

1. Register a regular account first
2. Open Prisma Studio:
   ```bash
   cd backend
   bun run db:studio
   ```
3. This opens a web interface at http://localhost:5555
4. Click on the `users` table
5. Find your user and change `role` from `USER` to `ADMIN`
6. Save changes
7. Log out and log back in to your account

## Verification Checklist

- [ ] Bun is installed (`bun --version` works)
- [ ] PostgreSQL is running
- [ ] Backend dependencies installed
- [ ] Backend `.env` file configured
- [ ] Database schema pushed successfully
- [ ] Frontend dependencies installed
- [ ] ShadCN components added
- [ ] Frontend `.env.local` file configured
- [ ] Backend running on http://localhost:3001
- [ ] Frontend running on http://localhost:3000
- [ ] Can register a new user
- [ ] Can log in
- [ ] (Optional) Admin user created

## Common Issues

### "Connection refused" errors
- Make sure PostgreSQL is running
- Check DATABASE_URL in backend/.env

### "Module not found" errors
- Run `bun install` again in the affected directory
- Clear caches: `rm -rf node_modules .next` then reinstall

### Port already in use
- Change PORT in backend/.env to 3002 (or any available port)
- Update NEXT_PUBLIC_API_URL in frontend/.env.local accordingly

### Prisma errors
- Regenerate client: `cd backend && bun run db:generate`
- Reset database: `cd backend && bunx prisma migrate reset`

## Next Steps

Now that your application is running:

1. **Read SETUP.md** for more detailed configuration options
2. **Read CLAUDE.md** to understand the project architecture
3. **Create your first certification** using the admin API
4. **Upload questions** via the `/admin/upload` page
5. **Build and take exams** to test the full workflow

## API Documentation

View the auto-generated API docs at:
- **http://localhost:3001/swagger**

This shows all available endpoints and allows you to test them directly.

## Need Help?

- Check SETUP.md for detailed troubleshooting
- Review backend logs in Terminal 1
- Check browser console (F12) for frontend errors
- View API documentation at /swagger
- Inspect database with Prisma Studio

---

You're all set! Happy coding! 🚀
