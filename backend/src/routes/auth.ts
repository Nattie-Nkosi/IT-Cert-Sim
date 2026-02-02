import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { logAudit, getClientInfo } from '../lib/auditLog';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    })
  )
  .post(
    '/register',
    async ({ body, jwt, headers }) => {
      const { email, password, name } = body;
      const clientInfo = getClientInfo(headers as Record<string, string>);

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        await logAudit({
          action: 'REGISTER',
          details: { email, success: false, reason: 'User already exists' },
          ...clientInfo,
        });
        throw new Error('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
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
        password: t.String({ minLength: 6 }),
        name: t.String(),
      }),
    }
  )
  .post(
    '/login',
    async ({ body, jwt, headers }) => {
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
        throw new Error('Invalid credentials');
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        await logAudit({
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: { email, reason: 'Invalid password' },
          ...clientInfo,
        });
        throw new Error('Invalid credentials');
      }

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
  );
