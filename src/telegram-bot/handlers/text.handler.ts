import { Context } from 'telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { Session, sessions } from '../sessions';
import { Message } from 'telegraf/typings/core/types/typegram';
import { EventType, RecipeStatus } from '@prisma/client';

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
    if (!session) {
      await ctx.reply('Пожалуйста, начните с команды /start');
      return;
    }
    if (!ctx.message) return;
    const message = ctx.message as Message.TextMessage;
    const text = message.text.trim();

    switch (session.step) {
      case 1:
        session.employeeId = text;
        session.step = 2;
        await ctx.reply('Введите имя клиента:');
        break;
      case 2:
        session.clientName = text;
        session.step = 3;
        await ctx.reply('Введите город:');
        break;

      case 3:
        session.city = text;
        session.step = 4;
        await ctx.reply('Введите улицу:');
        break;

      case 4:
        session.street = text;
        session.step = 5;
        await ctx.reply('Введите номер дома:');
        break;

      case 5: {
        session.houseNumber = text;
        session.step = 6;

        if (!session.city || !session.street || !session.houseNumber) {
          await ctx.reply(
            'Пожалуйста, введите полный адрес: город, улицу и номер дома.',
          );
          return;
        }

        const coords = await options.getCoordinatesFromAddressParts({
          city: session.city,
          street: session.street,
          houseNumber: session.houseNumber,
        });

        if (!coords) {
          await ctx.reply(
            'Не удалось найти координаты для этого адреса. Попробуйте снова:',
          );
          return;
        }

        session.lat = coords.lat;
        session.lng = coords.lng;
        session.address = `${session.city}, ${session.street} ${session.houseNumber}`;

        await ctx.reply('Введите цену:');
        break;
      }

      case 6: {
        const price = parseFloat(text);
        if (isNaN(price)) {
          await ctx.reply('Цена должна быть числом. Повторите ввод:');
          return;
        }
        session.price = price;
        if (
          !session.clientName ||
          !session.address ||
          !session.employeeId ||
          !session.price
        ) {
          await ctx.reply('Данные неполные. Пожалуйста, начните заново /start');
          return;
        }

        try {
          const maxPositionResult = await options.prisma.recipe.aggregate({
            where: { status: RecipeStatus.NEW },
            _max: { position: true },
          });

          const maxPositionRaw = maxPositionResult._max.position;
          const maxPosition: number =
            typeof maxPositionRaw === 'number' ? maxPositionRaw : -1;

          const nextPosition = maxPosition + 1;

          const recipe = await options.prisma.recipe.create({
            data: {
              clientName: session.clientName,
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

          await ctx.reply(`Заказ создан!\nСсылка: ${link}`);
          await ctx.replyWithPhoto({ source: buffer });

          sessions.delete(userId);
        } catch (error) {
          console.error('Ошибка при создании заказа:', error);
          await ctx.reply(
            'Произошла ошибка при создании заказа. Попробуйте снова.',
          );
        }
        break;
      }

      default:
        await ctx.reply('Пожалуйста, начните с команды /start');
        break;
    }

    sessions.set(userId, session);
  };
}
