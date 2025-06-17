import { Context } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { sessions } from '../sessions';

type ActionContext = Context & { match: RegExpMatchArray };

export function createEmployeeSelectionHandler(prisma: PrismaService) {
  return async (ctx: ActionContext) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const employeeId = ctx.match[1];
    if (!employeeId) {
      await ctx.reply('Неверный формат выбора сотрудника.');
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      await ctx.reply('Сотрудник не найден.');
      return;
    }

    const session = sessions.get(userId) ?? { step: 1 };
    session.step = 2;
    session.employeeId = employee.id;
    session.employeeName = employee.name;
    sessions.set(userId, session);

    await ctx.answerCbQuery();
    await ctx.reply('Введите имя клиента:');
  };
}
