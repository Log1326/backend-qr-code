import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.employee.findMany({
      select: { id: true, name: true },
    });
  }

  async findByIds(ids: string[]) {
    return this.prisma.employee.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
  }
}
