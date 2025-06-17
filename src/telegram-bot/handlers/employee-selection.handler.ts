// handlers/employee-selection.handler.ts
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
      await ctx.reply('❗ Неверный формат выбора сотрудника.');
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      await ctx.reply('❌ Сотрудник не найден.');
      return;
    }

    sessions.set(userId, {
      step: 1,
      employeeId: employee.id,
      employeeName: employee.name,
    });

    await ctx.answerCbQuery();
    await ctx.reply(`✅ Вы выбрали: *${employee.name}*`, {
      parse_mode: 'Markdown',
    });

    await ctx.reply(`Что вы хотите сделать?`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 Мои заказы', callback_data: 'show_myorders' }],
          [{ text: '➕ Новый заказ', callback_data: 'start_neworder' }],
          [{ text: 'ℹ️ Помощь', callback_data: 'show_help' }],
        ],
      },
    });
  };
}
