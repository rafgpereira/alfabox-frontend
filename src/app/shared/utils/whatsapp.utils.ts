/**
 * Gera a URL wa.me para abrir o WhatsApp no número informado.
 * Remove todos os caracteres não-numéricos e adiciona o código do Brasil (+55).
 *
 * @param phone Número de telefone (com ou sem máscara, com DDD obrigatório)
 * @returns URL no formato https://wa.me/55XXXXXXXXXXX
 */
export function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/55${digits}`;
}
