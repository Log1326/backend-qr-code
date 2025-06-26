import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role, User } from '@prisma/client';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Pick<User, 'id' | 'name'>[]> {
    return this.prisma.user.findMany({
      where: { role: Role.EMPLOYEE },
      select: { id: true, name: true },
    });
  }

  async findByIds(ids: string[]): Promise<Pick<User, 'id' | 'name'>[]> {
    return this.prisma.user.findMany({
      where: {
        id: { in: ids },
        role: Role.EMPLOYEE,
      },
      select: { id: true, name: true },
    });
  }
}
