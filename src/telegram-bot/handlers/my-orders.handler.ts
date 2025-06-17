import { PrismaService } from 'src/prisma/prisma.service';
import { Context, MiddlewareFn, Markup } from 'telegraf';
import { sessions } from '../sessions';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function showMyOrdersHandler(
  prisma: PrismaService,
): MiddlewareFn<Context> {
  return async (ctx: Context) => {
    try {
      const userId = ctx.from?.id;
      const session = userId ? sessions.get(userId) : null;

      if (!session?.employeeId) {
        await ctx.answerCbQuery();
        return ctx.reply('❗ Сначала выберите сотрудника через /start');
      }

      let offset = 0;
      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        const match = data.match(/show_myorders:(\d+)/);
        if (match) {
          offset = parseInt(match[1], 10);
        }
      }

      const limit = 5;

      const orders = await prisma.recipe.findMany({
        where: { employeeId: session.employeeId },
        select: {
          clientName: true,
          address: true,
          status: true,
          price: true,
          employee: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      });

      if (!orders.length) {
        await ctx.answerCbQuery();
        return ctx.reply('У вас больше нет заказов.');
      }

      const message = orders
        .map(
          (order) =>
            `🧾 <b>${escapeHtml(order.clientName)}</b>\n` +
            `📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}">${escapeHtml(order.address)}</a>\n` +
            `👤 Сотрудник: <b>${escapeHtml(order.employee.name ?? '—')}</b>\n` +
            `📊 Статус: ${escapeHtml(order.status)}\n` +
            `💰 ${order.price}₪\n`,
        )
        .join('\n\n');

      const nextOrdersCount = await prisma.recipe.count({
        where: { employeeId: session.employeeId },
        skip: offset + limit,
      });

      const buttons: InlineKeyboardButton.CallbackButton[][] = [];

      if (nextOrdersCount > 0) {
        buttons.push([
          Markup.button.callback(
            '⬇️ Загрузить ещё',
            `show_myorders:${offset + limit}`,
          ),
        ]);
      }

      await ctx.answerCbQuery();

      // Если это callbackQuery — удаляем предыдущее сообщение с кнопками
      if (ctx.callbackQuery?.message?.message_id) {
        try {
          await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
        } catch (err) {
          console.warn('Не удалось удалить сообщение:', err);
        }
      }

      return ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: buttons.length
          ? Markup.inlineKeyboard(buttons).reply_markup
          : undefined,
      });
    } catch (err) {
      console.error('Ошибка в showMyOrdersHandler:', err);
      await ctx.answerCbQuery();
      return ctx.reply('❌ Произошла ошибка при получении заказов.');
    }
  };
}
