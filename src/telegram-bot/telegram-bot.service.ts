import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Markup, Telegraf } from 'telegraf';
import { sendQRCodeToVercelBlobDirect } from '../utils/qr';
import { getCoordinatesFromAddressParts } from '../utils/geocode';
import { EventType, RecipeStatus } from '@prisma/client';

const token: string = process.env.TELEGRAM_BOT_TOKEN!;
const projectLink: string = process.env.WEB_LINK_PROJECT!;

interface Session {
  step: number;
  employeeId?: string;
  employeeName?: string;
  clientName?: string;
  city?: string;
  houseNumber?: string;
  street?: string;
  lat?: number;
  lng?: number;
  price?: number;
  address?: string;
}

const sessions = new Map<number, Session>();

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.bot = new Telegraf(token);

    // 1. Старт — выбор сотрудника
    this.bot.start(async (ctx) => {
      const employees = await this.prisma.employee.findMany();
      if (!employees.length) {
        await ctx.reply('Нет доступных сотрудников в базе.');
        return;
      }

      const keyboard = employees.map((emp) => [
        Markup.button.callback(emp.name, `select_employee:${emp.id}`),
      ]);

      sessions.set(ctx.from.id, { step: 1 });
      await ctx.reply('Выберите сотрудника:', Markup.inlineKeyboard(keyboard));
    });

    // 2. Обработка выбора сотрудника
    this.bot.action(/select_employee:(.+)/, async (ctx) => {
      const userId = ctx.from.id;
      const employeeId = ctx.match[1];

      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        await ctx.reply('Сотрудник не найден.');
        return;
      }

      const session = sessions.get(userId) ?? { step: 1 };
      session.step = 2;
      session.employeeName = employee.name;
      session.employeeId = employee.id;
      sessions.set(userId, session);

      await ctx.answerCbQuery();
      await ctx.reply('Введите имя клиента:');
    });

    // 3. Обработка текста на каждом шаге
    this.bot.on('text', async (ctx) => {
      const userId = ctx.from.id;
      const session = sessions.get(userId);

      if (!session) {
        await ctx.reply('Пожалуйста, начните с команды /start');
        return;
      }

      const text = ctx.message.text.trim();

      switch (session.step) {
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

          const coords = await getCoordinatesFromAddressParts({
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
            await ctx.reply(
              'Данные неполные. Пожалуйста, начните заново /start',
            );
            return;
          }

          try {
            const maxPositionResult = await this.prisma.recipe.aggregate({
              where: { status: RecipeStatus.NEW },
              _max: { position: true },
            });

            const maxPositionRaw = maxPositionResult._max.position;
            const maxPosition: number =
              typeof maxPositionRaw === 'number' ? maxPositionRaw : -1;

            const nextPosition = maxPosition + 1;

            const recipe = await this.prisma.recipe.create({
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
            const { buffer, url } = await sendQRCodeToVercelBlobDirect(
              link,
              recipe.id,
            );

            await this.prisma.recipe.update({
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
    });

    void this.bot.launch();
  }

  onModuleDestroy() {
    this.bot.stop();
  }
}
