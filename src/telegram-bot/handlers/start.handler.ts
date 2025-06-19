import { Context, Markup } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { sessions } from '../sessions';
import { translate, TypeLang } from '../text';

const SUPPORTED_LANGS: TypeLang[] = ['ru', 'en', 'he'];

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

  const userLang = ctx.from?.language_code;
  const lang: TypeLang = SUPPORTED_LANGS.includes(userLang as TypeLang)
    ? (userLang as TypeLang)
    : 'ru';

  sessions.set(ctx.from!.id, {
    step: 1,
    lang,
  });

  await ctx.reply(translate(lang, 'choose_employee'), keyboard);
}
