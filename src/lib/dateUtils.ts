/**
 * Utilitários centralizados de formatação de data para o padrão brasileiro: dia/mês/ano (DD/MM/AAAA)
 * Projetado para evitar shifts acidentais de fuso horário UTC em datas no formato YYYY-MM-DD.
 */

/**
 * Formata uma data para o padrão dia/mês/ano (ex: 15/09/2026).
 * Aceita strings 'YYYY-MM-DD', strings ISO 'YYYY-MM-DDTHH:mm:ss', ou instâncias de Date.
 */
export function formatDateBR(val?: string | Date | null): string {
  if (!val) return '-';

  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Caso seja formato YYYY-MM-DD simples (ex: retornos do banco / inputs de data)
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      return `${day}/${month}/${year}`;
    }

    // Se já estiver no formato DD/MM/AAAA
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      return `${d}/${m}/${y}`;
    }

    return trimmed;
  }

  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return '-';
}

/**
 * Formata uma data e hora para o padrão DD/MM/AAAA HH:mm (ou DD/MM/AAAA HH:mm:ss).
 */
export function formatDateTimeBR(val?: string | Date | null, includeSeconds: boolean = false): string {
  if (!val) return '-';

  let dateObj: Date;
  if (typeof val === 'string') {
    dateObj = new Date(val);
  } else if (val instanceof Date) {
    dateObj = val;
  } else {
    return '-';
  }

  if (isNaN(dateObj.getTime())) {
    return typeof val === 'string' ? val : '-';
  }

  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const mins = String(dateObj.getMinutes()).padStart(2, '0');

  if (includeSeconds) {
    const secs = String(dateObj.getSeconds()).padStart(2, '0');
    return `${d}/${m}/${y} ${hours}:${mins}:${secs}`;
  }

  return `${d}/${m}/${y} ${hours}:${mins}`;
}

/**
 * Formata um intervalo de datas no padrão "DD/MM/AAAA a DD/MM/AAAA".
 */
export function formatDateRangeBR(start?: string | Date | null, end?: string | Date | null): string {
  const startFmt = formatDateBR(start);
  const endFmt = formatDateBR(end);
  return `${startFmt} a ${endFmt}`;
}
