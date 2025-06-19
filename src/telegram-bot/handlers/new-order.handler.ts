import { Context } from 'telegraf';
import { sessions } from '../sessions';
import { translate } from '../text';

export async function newOrderHandler(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = sessions.get(userId);
  const lang = session?.lang || 'ru';

  await ctx.reply(translate(lang, 'enter_client_name'));

  if (session) session.step = 2;
  else sessions.set(userId, { step: 2, lang });
}
