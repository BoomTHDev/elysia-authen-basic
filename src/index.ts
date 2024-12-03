import { Elysia } from 'elysia';
import { authRoutes } from './route';

export const app = new Elysia({ prefix: '/api' })
  .use(authRoutes)
  .listen(3002);

console.log('🦊 Elysia is running at http://localhost:3002');