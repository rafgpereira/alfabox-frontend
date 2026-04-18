/**
 * Configurações do ambiente de DESENVOLVIMENTO.
 *
 * - apiUrl: aponta para o backend local (NestJS rodando na porta 3000).
 * - production: flag usada para habilitar/desabilitar comportamentos
 *   específicos de produção (ex: logs, service workers, etc.).
 *
 * Em produção, o Angular CLI substitui este arquivo por environment.prod.ts
 * através da configuração "fileReplacements" no angular.json.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
};
