import { Context } from 'telegraf';
import { sessions } from '../sessions';
import { translate } from '../text';

export async function endSessionHandler(ctx: Context) {
  const userId = ctx.from?.id;
  const session = userId ? sessions.get(userId) : null;
  const lang = session?.lang || 'ru';

  if (userId) sessions.delete(userId);

  await ctx.answerCbQuery();
  await ctx.reply(translate(lang, 'session_ended'));
}
