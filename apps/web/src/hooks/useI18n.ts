import i18n from '../i18n.json';

export function t(key: string): string {
  return (i18n as Record<string, string>)[key] || key;
}
