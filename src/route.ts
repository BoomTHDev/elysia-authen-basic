import { Elysia, t } from 'elysia';
import { userDTO } from './dto/user.dto';
import { jwt } from '@elysiajs/jwt';

const body = t.Object({
  name: t.String(),
  email: t.String(),
  password: t.String(),
});

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(
    jwt({
      name: 'jwt_auth',
      secret: process.env.SECRET_JWT!,
      exp: '1d',
    })
  )

  // ดึงข้อมูล token user จาก header
  .derive(async ({ headers, jwt_auth }) => {
    const auth = headers['authorization']; // ใช้ lowercase
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  
    if (!token) {
      console.log('No token found in Authorization header');
      return { user: null };
    }
  
    try {
      const user = await jwt_auth.verify(token); // ตรวจสอบ token
      return { user };
    } catch (error) {
      console.error('JWT Verification failed:', error);
      return { user: null };
    }
  })

  .post('/sign-up', async ({ body, jwt_auth, set }) => {
    // check user in db
    const user = await userDTO.findUserByEmail(body.email);
    if (user) {
      set.status = 400;
      return {
        message: 'User already exists',
      };
    };

    // create new user
    const newUser = await userDTO.createUser(body);

    // create jwt token
    const token = await jwt_auth.sign({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    set.status = 200;
    return token;
  }, {
    body
  })

  .post('/sign-in', async ({ body, jwt_auth, set }) => {
    // check user in db
    const user = await userDTO.findUserByEmail(body.email);
    if (!user) {
      set.status = 400;
      return {
        message: 'User not found',
      };
    };

    // check password
    const isMatch = await userDTO.verifyPassword(body.password, user.password);
    if (!isMatch) {
      set.status = 400;
      return {
        message: 'Invalid password',
      };
    };

    // create jwt token
    const token = await jwt_auth.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return token;
  }, { body })

  .guard({
    beforeHandle({ user, set }) {
      if (!user) return (set.status = "Unauthorized");
    },
  }, app => (
    app.get('/me', ({ user, error }) => {
      if (!user) return error(401, "Not Authorized");
      return user
    })
  ));