// handlers/employee-selection.handler.ts
import { Context } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { sessions } from '../sessions';
import { getCommonButtons } from '../buttons';
import { translate } from '../text';

type ActionContext = Context & { match: RegExpMatchArray };

export function createEmployeeSelectionHandler(prisma: PrismaService) {
  return async (ctx: ActionContext) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const session = sessions.get(userId);
    const lang = session?.lang ?? 'ru';
    const employeeId = ctx.match[1];
    if (!employeeId) {
      await ctx.reply(translate(lang, 'invalid_employee_format'));
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      await ctx.reply(translate(lang, 'employee_not_found'));
      return;
    }

    sessions.set(userId, {
      step: 1,
      lang,
      employeeId: employee.id,
      employeeName: employee.name,
    });

    await ctx.answerCbQuery();
    await ctx.reply(
      `${translate(lang, 'employee_chosen')} *${employee.name}*`,
      { parse_mode: 'Markdown' },
    );

    await ctx.reply(translate(lang, 'choose_action'), {
      reply_markup: {
        inline_keyboard: getCommonButtons(lang),
      },
    });
  };
}
