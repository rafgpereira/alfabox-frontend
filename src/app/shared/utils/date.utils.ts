/**
 * Utilitários de data para o sistema.
 *
 * Aqui trabalhamos SEMPRE com datas locais (sem componente de horário),
 * evitando o problema clássico de fuso horário onde o JavaScript
 * converte para UTC e o dia "volta" um dia ao cruzar a meia-noite.
 *
 * Regra de ouro:
 *   - Para exibição/seleção → use objetos `Date` com horário zerado (meia-noite local)
 *   - Para enviar ao backend → use `toApiDate()` que gera 'YYYY-MM-DD' local
 *   - Para receber do backend → use `fromApiDate()` que evita parsing UTC
 */

/**
 * Retorna a data atual como objeto Date com horário zerado no fuso local.
 * Use como valor default de campos de data.
 */
export function todayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Converte um objeto Date para string 'YYYY-MM-DD' usando o fuso LOCAL.
 * Nunca use `.toISOString()` para datas sem horário — ela converte para UTC
 * e pode recuar o dia caso o fuso local seja negativo em relação ao UTC.
 */
export function toApiDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converte uma string 'YYYY-MM-DD' vinda do backend em objeto Date
 * com horário zerado no fuso LOCAL (evita o problema do UTC shift).
 *
 * `new Date('2025-06-10')` interpreta como UTC → pode mostrar 09/06 em fusos negativos.
 * Esta função usa o construtor com partes individuais, que é sempre local.
 */
export function fromApiDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
