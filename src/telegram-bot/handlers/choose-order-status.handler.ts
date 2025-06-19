import { Context, Markup } from 'telegraf';
import { sessions } from '../sessions';
import { translate } from '../text';
import { getStatusButtons } from '../buttons';

export const handleChooseOrderStatus = async (ctx: Context): Promise<void> => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id;
  if (!userId) return;
  const session = sessions.get(userId);
  const lang = session?.lang ?? 'ru';
  const keyboard = Markup.inlineKeyboard(getStatusButtons(lang));

  await ctx.reply(translate(lang, 'choose_order_status'), {
    reply_markup: keyboard.reply_markup,
  });
};
