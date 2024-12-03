import { User } from '@prisma/client';
import { db } from '../db';

interface UserDTO {
  findUserByEmail: (email: string) => Promise<User | null>;
  createUser: (user: UserReq) => Promise<User>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
};

type UserReq = {
  name: string;
  email: string;
  password: string;
};

export const userDTO: UserDTO = {
  findUserByEmail: async (email: string) => {
    const user = await db.user.findUnique({ where: { email }});
    return user;
  },
  createUser: async (user: UserReq) => {
    const hashPassword = await Bun.password.hash(user.password, {
      algorithm: 'bcrypt',
      cost: 10,
    });
    const newUser = await db.user.create({ data: {
      name: user.name,
      email: user.email,
      password: hashPassword,
      role: 'user',
    }});

    return newUser;
  },
  verifyPassword: async (password: string, hash: string) => {
    return await Bun.password.verify(password, hash);
  },
};