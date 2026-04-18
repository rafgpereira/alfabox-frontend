/**
 * Configurações do ambiente de PRODUÇÃO.
 *
 * - apiUrl: em produção, normalmente o frontend e o backend ficam
 *   atrás de um mesmo domínio/proxy reverso (ex: Nginx), então usamos
 *   '/api' como prefixo relativo. Ajuste conforme sua infraestrutura.
 * - production: true habilita otimizações e desabilita logs de debug.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
};
