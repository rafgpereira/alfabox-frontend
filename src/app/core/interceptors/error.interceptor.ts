import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor global de erros HTTP.
 *
 * Centraliza a exibição de mensagens de erro via toast (PrimeNG),
 * evitando que cada componente precise tratar erros manualmente.
 *
 * Lógica:
 * - status === 0       → Sem resposta do servidor (rede, CORS, servidor offline)
 * - displayable: true  → Mensagem de negócio vinda do backend, segura para exibir
 * - displayable: false → Erro de sistema/framework, exibe mensagem genérica
 *
 * O erro é RE-LANÇADO (throwError) para que o componente ainda possa
 * reagir no callback `error` do subscribe (ex: parar loading, etc.),
 * mas sem precisar montar a mensagem de toast.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let detail: string;

      if (error.status === 0) {
        // Sem resposta — problema de rede, CORS ou servidor offline
        detail = 'Sem conexão com o servidor. Verifique sua rede.';
      } else if (error.error?.displayable === true) {
        // Erro de negócio — mensagem segura para exibir
        const msg = error.error.message;
        detail = Array.isArray(msg) ? msg[0] : msg;
      } else {
        // Erro de sistema — não expõe detalhes técnicos
        detail = 'Ocorreu um erro inesperado. Tente novamente.';
      }

      messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail,
      });

      return throwError(() => error);
    }),
  );
};
