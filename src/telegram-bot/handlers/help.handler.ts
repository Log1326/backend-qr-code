import { Context, Markup } from 'telegraf';
import { sessions } from '../sessions';
import { translate } from '../text';

export const handleHelp = async (ctx: Context) => {
  const userId = ctx.from?.id;
  const session = userId ? sessions.get(userId) : null;
  const lang = session?.lang || 'ru';

  await ctx.answerCbQuery();

  await ctx.reply(translate(lang, 'help_message'), {
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback(translate(lang, 'back'), 'back_to_main')],
    ]).reply_markup,
  });
};
