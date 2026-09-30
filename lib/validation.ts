/**
 * Validação e sanitização de entradas do usuário.
 * Todas as entradas de formulários públicas passam por aqui.
 */

/** Remove tags e caracteres de controle, limita tamanho. */
export function sanitizeText(value: string, maxLength = 500): string {
  return value
    .replace(/<[^>]*>/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Mantém apenas dígitos (telefone, etc). */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Valida telefone brasileiro com DDD (10 ou 11 dígitos). */
export function isValidPhone(value: string): boolean {
  const digits = onlyDigits(value);
  const local = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  return local.length === 10 || local.length === 11;
}

/** Valida URL http(s) simples (campo de referência). */
export function isValidUrl(value: string): boolean {
  if (!value.trim()) return true; // opcional
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Data no formato YYYY-MM-DD (input type="date"). */
export function isValidISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Quantidade inteira dentro de um intervalo. */
export function clampQuantity(value: number, min = 1, max = 999): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
