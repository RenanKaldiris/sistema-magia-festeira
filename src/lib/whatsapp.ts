/**
 * Configuração e utilitários centralizados para o WhatsApp da Magia Festeira.
 * 
 * O número oficial pode ser configurado via variável de ambiente:
 * NEXT_PUBLIC_WHATSAPP_NUMBER=5511999998888
 * 
 * Se não definido, utiliza o número padrão cadastrado.
 */

export const DEFAULT_WHATSAPP_NUMBER = '5511999998888';

/**
 * Normaliza qualquer string de telefone para o formato internacional de link wa.me
 * Exemplo: "(11) 99999-8888" -> "5511999998888"
 */
export function sanitizeWhatsAppNumber(phone?: string | null): string {
  if (!phone) {
    const envPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    phone = envPhone || DEFAULT_WHATSAPP_NUMBER;
  }

  const digits = phone.replace(/\D/g, '');
  if (!digits) return DEFAULT_WHATSAPP_NUMBER;

  // Se já tiver 55 no início e mais 10 ou 11 dígitos
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  // Se for número brasileiro com DDD (10 ou 11 dígitos, ex: 11999998888)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Retorna o número oficial configurado da Magia Festeira para wa.me
 */
export function getOfficialWhatsAppNumber(): string {
  return sanitizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
}

/**
 * Formata o número para exibição legível na interface
 * Exemplo: "5511999998888" -> "(11) 99999-8888"
 */
export function formatWhatsAppDisplay(phone?: string | null): string {
  const clean = sanitizeWhatsAppNumber(phone);
  // Remove 55 se estiver no início
  const local = clean.startsWith('55') ? clean.slice(2) : clean;

  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  } else if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }

  return phone || '(11) 99999-8888';
}

/**
 * Gera o link direto wa.me com mensagem pré-formatada
 */
export function getWhatsAppUrl(text?: string, phoneOverride?: string): string {
  const number = sanitizeWhatsAppNumber(phoneOverride);
  if (!text) {
    return `https://wa.me/${number}`;
  }
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
