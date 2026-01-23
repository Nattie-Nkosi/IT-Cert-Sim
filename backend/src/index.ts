import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { jwt } from '@elysiajs/jwt';

import { authRoutes } from './routes/auth';
import { certificationRoutes } from './routes/certifications';
import { questionRoutes } from './routes/questions';
import { examRoutes } from './routes/exams';
import { adminRoutes } from './routes/admin';

const app = new Elysia()
  .use(cors())
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: 'IT Cert Simulator API',
          version: '1.0.0',
        },
      },
    })
  )
  .get('/', () => ({ message: 'IT Cert Simulator API' }))
  .use(authRoutes)
  .use(certificationRoutes)
  .use(questionRoutes)
  .use(examRoutes)
  .use(adminRoutes)
  .listen(process.env.PORT || 3001);

console.log(`🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`);
