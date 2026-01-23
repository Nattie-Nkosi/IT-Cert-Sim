import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';

export const authMiddleware = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    })
  )
  .derive(async ({ headers, jwt }) => {
    const auth = headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = auth.slice(7);
    const payload = await jwt.verify(token);

    if (!payload) {
      throw new Error('Invalid token');
    }

    return {
      user: payload as { id: string; email: string; role: string },
    };
  });

export const adminMiddleware = new Elysia()
  .use(authMiddleware)
  .derive((context: any) => {
    const user = context.user;
    if (user.role !== 'ADMIN') {
      throw new Error('Forbidden: Admin access required');
    }
    return { user };
  });
