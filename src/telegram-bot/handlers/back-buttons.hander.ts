import { Context } from 'telegraf';
import { sessions } from '../sessions';
import { getCommonButtons } from '../buttons';
import { translate } from '../text';

export const handleBackButtons = async (ctx: Context): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = sessions.get(userId);
  const lang = session?.lang ?? 'ru';

  await ctx.answerCbQuery();
  await ctx.reply(translate(lang, 'choose_action'), {
    reply_markup: {
      inline_keyboard: getCommonButtons(lang),
    },
  });
};
