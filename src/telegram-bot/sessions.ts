import { TypeLang } from './text';

export interface Session {
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
  lang?: TypeLang;
}

export const sessions = new Map<number, Session>();
