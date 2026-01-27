import { Elysia } from 'elysia';

export const authMiddleware = new Elysia()
  .derive(async (context: any) => {
    try {
      const { headers, jwt } = context;

      console.log('Auth middleware - checking authorization');

      const auth = headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        console.error('No authorization header or invalid format');
        throw new Error('Unauthorized');
      }

      const token = auth.slice(7);
      const payload = await jwt.verify(token);

      if (!payload) {
        console.error('Invalid token - verification failed');
        throw new Error('Invalid token');
      }

      console.log('Auth successful for user:', payload.id);

      return {
        user: payload as { id: string; email: string; role: string },
      };
    } catch (error: any) {
      console.error('Auth middleware error:', error.message);
      throw error;
    }
  });

export const adminMiddleware = new Elysia()
  .use(authMiddleware)
  .derive((context: any) => {
    try {
      const user = context.user;

      console.log('Admin middleware - checking role for user:', user?.id, 'role:', user?.role);

      if (!user || user.role !== 'ADMIN') {
        console.error('User is not admin, role:', user?.role);
        throw new Error('Forbidden: Admin access required');
      }

      console.log('Admin check passed');

      return { user };
    } catch (error: any) {
      console.error('Admin middleware error:', error.message);
      throw error;
    }
  });
