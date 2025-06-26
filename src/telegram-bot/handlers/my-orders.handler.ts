import { PrismaService } from 'src/prisma/prisma.service';
import { Context, MiddlewareFn, Markup } from 'telegraf';
import { sessions } from '../sessions';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { RecipeStatus } from '@prisma/client';
import { translate, TranslationKeys } from '../text';

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
      const lang = session?.lang ?? 'ru';

      if (!session?.employeeId) {
        await ctx.answerCbQuery();
        return ctx.reply(translate(lang, 'need_select_employee_first'));
      }

      let statusFilter: RecipeStatus | undefined;
      let offset = 0;

      if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
        const data = ctx.callbackQuery.data;
        const match = data.match(/^show_myorders(?::(\w+))?(?::(\d+))?$/);
        if (match) {
          const statusParam = match[1];
          const offsetParam = match[2];

          const validStatuses: RecipeStatus[] = [
            'NEW',
            'IN_PROGRESS',
            'COMPLETED',
          ];
          if (
            statusParam &&
            validStatuses.includes(statusParam as RecipeStatus)
          ) {
            statusFilter = statusParam as RecipeStatus;
          }

          offset = offsetParam ? parseInt(offsetParam, 10) : 0;
        }
      }

      const limit = 5;

      const orders = await prisma.recipe.findMany({
        where: {
          employeeId: session.employeeId,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        select: {
          client: {
            select: {
              name: true,
            },
          },
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
        return ctx.reply(translate(lang, 'no_more_orders'));
      }
      const statusMap: Record<RecipeStatus, TranslationKeys> = {
        NEW: 'status_new',
        IN_PROGRESS: 'status_in_progress',
        COMPLETED: 'status_completed',
      };
      const message = orders
        .map((order) => {
          const statusTranslated = translate(lang, statusMap[order.status]);
          return (
            `📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              order.address,
            )}">${escapeHtml(order.address)}</a>\n` +
            `👤 ${translate(lang, 'employee')}: <b>${escapeHtml(order.employee.name ?? '—')}</b>\n` +
            `📊 ${translate(lang, 'status')}: ${statusTranslated}\n` +
            `💰 ${order.price}₪\n`
          );
        })
        .join('\n\n');

      const nextOrdersCount = await prisma.recipe.count({
        where: {
          employeeId: session.employeeId,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        skip: offset + limit,
      });

      const buttons: InlineKeyboardButton.CallbackButton[][] = [];

      if (nextOrdersCount > 0) {
        buttons.push([
          Markup.button.callback(
            translate(lang, 'load_more'),
            `show_myorders${statusFilter ? `:${statusFilter}` : ''}:${offset + limit}`,
          ),
        ]);
      }

      buttons.push([
        Markup.button.callback(translate(lang, 'back'), 'back_to_main'),
      ]);

      await ctx.answerCbQuery();

      if (ctx.callbackQuery?.message?.message_id) {
        try {
          await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
        } catch (err) {
          console.warn('Не удалось удалить сообщение:', err);
        }
      }

      return ctx.reply(message, {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
      });
    } catch (err) {
      console.error('Ошибка в showMyOrdersHandler:', err);
      await ctx.answerCbQuery();
      return ctx.reply('❌ ' + translate('ru', 'orders_error'));
    }
  };
}
