import { Markup } from 'telegraf';
import { translate, TypeLang } from '../text';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

export const getCommonButtons = (lang: TypeLang): InlineKeyboardButton[][] => [
  [Markup.button.callback(translate(lang, 'orders'), 'choose_order_status')],
  [Markup.button.callback(translate(lang, 'new_order'), 'start_neworder')],
  [Markup.button.callback(translate(lang, 'help_btn'), 'show_help')],
  [Markup.button.callback(translate(lang, 'end_session'), 'end_session')],
];

export const getStatusButtons = (lang: TypeLang): InlineKeyboardButton[][] => [
  [Markup.button.callback(translate(lang, 'orders_new'), 'show_myorders:NEW')],
  [
    Markup.button.callback(
      translate(lang, 'orders_in_progress'),
      'show_myorders:IN_PROGRESS',
    ),
  ],
  [
    Markup.button.callback(
      translate(lang, 'orders_completed'),
      'show_myorders:COMPLETED',
    ),
  ],
  [Markup.button.callback(translate(lang, 'orders_all'), 'show_myorders')],
];
