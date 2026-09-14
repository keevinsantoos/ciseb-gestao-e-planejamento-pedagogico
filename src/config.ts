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
  'https://chatgpt.com/g/g-67cd98a0c4f8819198642a8b3d6f1df8-mag-mentora-pedagogica-ciseb';

export { DEFAULT_MAG_EXTERNAL_URL };
