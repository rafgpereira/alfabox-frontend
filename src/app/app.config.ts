import {
  ApplicationConfig,
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Interceptors globais de HTTP:
    // - errorInterceptor: trata erros e exibe toasts automaticamente
    // - Quando implementar autenticação, adicione o authInterceptor aqui
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
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
      },
    }),
  ],
};
