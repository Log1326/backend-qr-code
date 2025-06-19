import * as ru from './ru.json';
import * as en from './en.json';
import * as he from './he.json';

export const translations = {
  ru,
  en,
  he,
} as const;

export type TypeLang = keyof typeof translations;
export type TranslationKeys = keyof typeof ru;
export const translate = (lang: TypeLang, key: TranslationKeys): string => {
  return (
    (translations[lang] as Record<string, string>)[key] ||
    (translations['en'] as Record<string, string>)[key] ||
    key
  );
};
