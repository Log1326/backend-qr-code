import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    email: string;
    name: string;
    password?: string;
    role?: Role;
    avatarUrl?: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(
    id: string,
    data: Partial<{
      email: string;
      name: string;
      password?: string;
      role?: Role;
      avatarUrl?: string;
    }>,
  ): Promise<User> {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<User> {
    await this.findById(id);
    return this.prisma.user.delete({ where: { id } });
  }
}
