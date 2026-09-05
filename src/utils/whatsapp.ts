/**
 * WhatsApp Utility Constants & Helper Functions
 * Official Primary WhatsApp Contact: 01640581442
 * International Format: +8801640581442
 */

export const PRIMARY_WHATSAPP_NUMBER = '01640581442';
export const PRIMARY_WHATSAPP_INTERNATIONAL = '+8801640581442';

/**
 * Normalizes any Bangladesh phone number string into the international format: +8801640581442
 */
export function formatWhatsAppInternational(phone?: string): string {
  if (!phone || typeof phone !== 'string') return PRIMARY_WHATSAPP_INTERNATIONAL;
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('880')) {
    return `+${digits}`;
  }
  if (digits.startsWith('01')) {
    return `+88${digits}`;
  }
  if (digits.startsWith('1')) {
    return `+880${digits}`;
  }
  return digits.length > 0 ? `+${digits}` : PRIMARY_WHATSAPP_INTERNATIONAL;
}

/**
 * Formats phone number for display: e.g. "01640581442" or "+8801640581442"
 */
export function formatWhatsAppDisplay(phone?: string): string {
  if (!phone || typeof phone !== 'string') return PRIMARY_WHATSAPP_NUMBER;
  const cleaned = phone.trim();
  return cleaned || PRIMARY_WHATSAPP_NUMBER;
}

/**
 * Generates the official WhatsApp link with international format (+8801640581442).
 * e.g. "https://wa.me/+8801640581442"
 */
export function getWhatsAppLink(phone?: string, text?: string): string {
  const intl = formatWhatsAppInternational(phone);
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${intl}${query}`;
}
