import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { logAudit, getClientInfo } from '../lib/auditLog';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const passwordSchema = t.String({
  minLength: 8,
  pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
  error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)',
});

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/\d/.test(password)) errors.push('One number');
  if (!/[@$!%*?&]/.test(password)) errors.push('One special character (@$!%*?&)');
  return { valid: errors.length === 0, errors };
}

function generateRefreshToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      exp: ACCESS_TOKEN_EXPIRY,
    })
  )
  .post(
    '/register',
    async ({ body, jwt, headers, set }) => {
      const { email, password, name } = body;
      const clientInfo = getClientInfo(headers as Record<string, string>);

      const validation = validatePassword(password);
      if (!validation.valid) {
        set.status = 400;
        return {
          error: 'Password does not meet requirements',
          requirements: validation.errors,
        };
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        await logAudit({
          action: 'REGISTER',
          details: { email, success: false, reason: 'User already exists' },
          ...clientInfo,
        });
        set.status = 400;
        return { error: 'User already exists' };
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const refreshToken = generateRefreshToken();

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          refreshToken,
          lastLoginAt: new Date(),
        },
      });

      await logAudit({
        userId: user.id,
        action: 'REGISTER',
        entity: 'user',
        entityId: user.id,
        details: { email, success: true },
        ...clientInfo,
      });

      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        token,
        refreshToken,
        expiresIn: 900,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
        name: t.String(),
      }),
    }
  )
  .post(
    '/login',
    async ({ body, jwt, headers, set }) => {
      const { email, password } = body;
      const clientInfo = getClientInfo(headers as Record<string, string>);

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        await logAudit({
          action: 'LOGIN_FAILED',
          details: { email, reason: 'User not found' },
          ...clientInfo,
        });
        set.status = 401;
        return { error: 'Invalid credentials' };
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        await logAudit({
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: { email, reason: 'Account locked' },
          ...clientInfo,
        });
        set.status = 423;
        return {
          error: 'Account is locked',
          lockedUntil: user.lockedUntil,
          remainingMinutes,
        };
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        const newAttempts = user.failedLoginAttempts + 1;
        const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: newAttempts,
            lockedUntil: shouldLock
              ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000)
              : null,
          },
        });

        await logAudit({
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: {
            email,
            reason: 'Invalid password',
            attempts: newAttempts,
            locked: shouldLock,
          },
          ...clientInfo,
        });

        set.status = 401;
        if (shouldLock) {
          return {
            error: 'Account locked due to too many failed attempts',
            lockedForMinutes: LOCKOUT_DURATION_MINUTES,
          };
        }
        return {
          error: 'Invalid credentials',
          remainingAttempts: MAX_LOGIN_ATTEMPTS - newAttempts,
        };
      }

      // Successful login - reset failed attempts
      const refreshToken = generateRefreshToken();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          refreshToken,
        },
      });

      await logAudit({
        userId: user.id,
        action: 'LOGIN',
        entity: 'user',
        entityId: user.id,
        details: { email, success: true },
        ...clientInfo,
      });

      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        token,
        refreshToken,
        expiresIn: 900,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
    }
  )
  .post(
    '/refresh',
    async ({ body, jwt, headers, set }) => {
      const { refreshToken } = body;
      const clientInfo = getClientInfo(headers as Record<string, string>);

      const user = await prisma.user.findFirst({
        where: { refreshToken },
      });

      if (!user) {
        await logAudit({
          action: 'SECURITY_EVENT',
          details: { reason: 'Invalid refresh token' },
          ...clientInfo,
        });
        set.status = 401;
        return { error: 'Invalid refresh token' };
      }

      // Generate new tokens
      const newRefreshToken = generateRefreshToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        token,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      };
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
    }
  )
  .post(
    '/logout',
    async ({ body, headers }) => {
      const { refreshToken } = body;
      const clientInfo = getClientInfo(headers as Record<string, string>);

      const user = await prisma.user.findFirst({
        where: { refreshToken },
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: null },
        });

        await logAudit({
          userId: user.id,
          action: 'LOGOUT',
          entity: 'user',
          entityId: user.id,
          ...clientInfo,
        });
      }

      return { success: true };
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
    }
  )
  .get('/password-requirements', () => ({
    minLength: 8,
    requirements: [
      'At least 8 characters',
      'One uppercase letter (A-Z)',
      'One lowercase letter (a-z)',
      'One number (0-9)',
      'One special character (@$!%*?&)',
    ],
  }));
