/**
 * CISEB 1.0 - Configurações Globais Centralizadas
 */
import { DEFAULT_MAG_EXTERNAL_URL } from './types';

/**
 * URL Oficial Externa da Assistente Pedagógica MAG (CISEB / SEDUC-PA)
 */
export const MAG_EXTERNAL_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAG_EXTERNAL_URL) ||
  DEFAULT_MAG_EXTERNAL_URL ||
  'https://gemini.google.com/gem/1miSU2iNW3sYwrsHDlsTacGy43YmQpLOP?usp=sharing';

export { DEFAULT_MAG_EXTERNAL_URL };
