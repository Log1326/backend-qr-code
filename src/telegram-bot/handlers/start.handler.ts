import { Context, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { sessions } from '../sessions';

export async function handleStart(ctx: Context, prisma: PrismaService) {
  const employees = await prisma.employee.findMany();

  if (!employees.length) {
    await ctx.reply('Нет доступных сотрудников.');
    return;
  }

  const keyboard = Markup.inlineKeyboard(
    employees.map((emp) =>
      Markup.button.callback(emp.name, `select_employee:${emp.id}`),
    ),
    { columns: 2 },
  );

  sessions.set(ctx.from!.id, { step: 1 });
  await ctx.reply('Выберите сотрудника:', keyboard);
}
