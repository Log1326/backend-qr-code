import { Context } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { Session, sessions } from '../sessions';
import { Message } from 'telegraf/typings/core/types/typegram';
import { EventType, RecipeStatus } from '@prisma/client';
import { translate } from '../text';
import { getCommonButtons } from '../buttons';

const projectLink: string = process.env.WEB_LINK_PROJECT!;

type TextHandlerOptions = {
  prisma: PrismaService;
  getCoordinatesFromAddressParts: (args: {
    city: string;
    street: string;
    houseNumber: string;
  }) => Promise<{ lat: number; lng: number } | null>;
  sendQRCodeToVercelBlobDirect: (
    link: string,
    recipeId: string,
  ) => Promise<{ buffer: Buffer; url: string }>;
};

export function createTextHandler(options: TextHandlerOptions) {
  return async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const session: Session | undefined = sessions.get(userId);
    const lang = session?.lang || 'ru';

    if (!session) {
      await ctx.reply(translate(lang, 'start_prompt'));
      return;
    }

    if (!ctx.message) return;
    const message = ctx.message as Message.TextMessage;
    const text = message.text.trim();

    switch (session.step) {
      case 1:
        session.employeeId = text;
        session.step = 2;
        await ctx.reply(translate(lang, 'enter_city'));
        break;

      case 2:
        session.city = text;
        session.step = 3;
        await ctx.reply(translate(lang, 'enter_street'));
        break;

      case 3:
        session.street = text;
        session.step = 4;
        await ctx.reply(translate(lang, 'enter_house_number'));
        break;

      case 4: {
        session.houseNumber = text;
        session.step = 5;

        if (!session.city || !session.street || !session.houseNumber) {
          await ctx.reply(translate(lang, 'missing_address'));
          session.step = 2;
          await ctx.reply(translate(lang, 'enter_city'));
          return;
        }

        const coords = await options.getCoordinatesFromAddressParts({
          city: session.city,
          street: session.street,
          houseNumber: session.houseNumber,
        });

        if (!coords) {
          await ctx.reply(translate(lang, 'coords_not_found'));
          session.step = 2;
          await ctx.reply(translate(lang, 'enter_city'));
          return;
        }

        session.lat = coords.lat;
        session.lng = coords.lng;
        session.address = `${session.city}, ${session.street} ${session.houseNumber}`;

        await ctx.reply(translate(lang, 'enter_price'));
        break;
      }

      case 5: {
        const price = parseFloat(text);
        if (isNaN(price)) {
          await ctx.reply(translate(lang, 'price_should_be_number'));
          return;
        }

        session.price = price;

        if (!session.address || !session.employeeId || !session.price) {
          await ctx.reply(translate(lang, 'incomplete_data'));
          return;
        }

        try {
          const maxPositionResult = await options.prisma.recipe.aggregate({
            where: { status: RecipeStatus.NEW },
            _max: { position: true },
          });

          const maxPositionRaw = maxPositionResult._max.position;
          const maxPosition =
            typeof maxPositionRaw === 'number' ? maxPositionRaw : -1;
          const nextPosition = maxPosition + 1;

          const recipe = await options.prisma.recipe.create({
            data: {
              address: session.address,
              price: session.price,
              employeeId: session.employeeId,
              status: RecipeStatus.NEW,
              position: nextPosition,
              events: {
                create: { type: EventType.CREATED },
              },
              locationLat: session.lat,
              locationLng: session.lng,
            },
          });

          const link = projectLink + '/recipes/' + recipe.id;
          const { buffer, url } = await options.sendQRCodeToVercelBlobDirect(
            link,
            recipe.id,
          );

          await options.prisma.recipe.update({
            where: { id: recipe.id },
            data: { qrCodeUrl: url },
          });

          await ctx.reply(
            `${translate(lang, 'order_created')}\n${translate(lang, 'link')}: ${link}`,
          );
          await ctx.replyWithPhoto({ source: buffer });

          sessions.delete(userId);

          await ctx.reply(translate(lang, 'choose_action'), {
            reply_markup: {
              inline_keyboard: getCommonButtons(lang),
            },
          });
        } catch (error) {
          console.error('Ошибка при создании заказа:', error);
          await ctx.reply(translate(lang, 'order_creation_error'));
        }
        session.step = 6;
        break;
      }
      case 6: {
        await ctx.reply(translate(lang, 'start_prompt'));
      }
      default:
        await ctx.reply('what???');
        break;
    }

    sessions.set(userId, session);
  };
}
