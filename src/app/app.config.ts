import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MyPreset } from './core/themes/my-app-theme';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MessageService, ConfirmationService } from 'primeng/api';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { registerLocaleData } from '@angular/common';
import localePtBr from '@angular/common/locales/pt';

registerLocaleData(localePtBr);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Interceptors globais de HTTP:
    // - errorInterceptor: trata erros e exibe toasts automaticamente
    // - Quando implementar autenticação, adicione o authInterceptor aqui
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
    provideEnvironmentNgxMask(),
    // Services globais do PrimeNG
    MessageService,
    ConfirmationService,
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: false,
          cssLayer: false,
        },
      },
      ripple: true,
      translation: {
        startsWith: 'Começa com',
        contains: 'Contém',
        notContains: 'Não contém',
        endsWith: 'Termina com',
        equals: 'Igual a',
        notEquals: 'Diferente de',
        noFilter: 'Sem filtro',
        lt: 'Menor que',
        lte: 'Menor ou igual a',
        gt: 'Maior que',
        gte: 'Maior ou igual a',
        dateIs: 'Data é',
        dateIsNot: 'Data não é',
        dateBefore: 'Antes de',
        dateAfter: 'Depois de',
        matchAll: 'Corresponde a todos',
        matchAny: 'Corresponde a algum',
        addRule: 'Adicionar regra',
        removeRule: 'Remover regra',
        apply: 'Aplicar',
        clear: 'Limpar',
        dateFormat: 'dd/mm/yy',
        monthNames: [
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro',
        ],
        monthNamesShort: [
          'Jan',
          'Fev',
          'Mar',
          'Abr',
          'Mai',
          'Jun',
          'Jul',
          'Ago',
          'Set',
          'Out',
          'Nov',
          'Dez',
        ],
        dayNames: [
          'Domingo',
          'Segunda-feira',
          'Terça-feira',
          'Quarta-feira',
          'Quinta-feira',
          'Sexta-feira',
          'Sábado',
        ],
        dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
        dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
      },
    }),
  ],
};
