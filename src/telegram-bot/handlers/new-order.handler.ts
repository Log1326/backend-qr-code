import { Context } from 'telegraf';
import { sessions } from '../sessions';

export function newOrderHandler() {
  return async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.reply('Начинаем новый заказ! Введите имя клиента:');
    const session = sessions.get(userId);
    if (session) session.step = 2;
  };
}
