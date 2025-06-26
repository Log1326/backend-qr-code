import { PrismaClient, Role, AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  console.log('🧹 Clearing existing users...');
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      name: 'Super User',
      email: 'superuser@example.com',
      password: passwordHash,
      role: Role.SUPERUSER,
      provider: AuthProvider.EMAIL,
    },
    {
      name: 'Employee One',
      email: 'employee@example.com',
      password: passwordHash,
      role: Role.EMPLOYEE,
      provider: AuthProvider.EMAIL,
    },
    {
      name: 'Client One',
      email: 'client@example.com',
      password: passwordHash,
      role: Role.CLIENT,
      provider: AuthProvider.EMAIL,
    },
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: passwordHash,
      role: Role.ADMIN,
      provider: AuthProvider.EMAIL,
    },
  ];

  for (const user of users) {
    await prisma.user.create({ data: user });
  }

  console.log('✅ Seed complete — 4 users created.');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('❌ Error during seed:', e);
  process.exit(1);
});
