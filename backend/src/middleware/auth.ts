import { Elysia } from 'elysia';

export const authMiddleware = new Elysia()
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
  .derive(({ user }) => {
    if (user.role !== 'ADMIN') {
      throw new Error('Forbidden: Admin access required');
    }
    return { user };
  });
