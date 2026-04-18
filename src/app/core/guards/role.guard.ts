import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

/**
 * Guard funcional que verifica a role do usuário.
 *
 * Uso nas rotas:
 *   canActivate: [roleGuard('ADMIN')]
 *   canActivate: [roleGuard('ADMIN', 'EMPLOYEE')]
 */
export const roleGuard =
  (...allowedRoles: string[]): CanActivateFn =>
  () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getUser();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    // Sem permissão → redireciona para a home (já logado, mas sem acesso)
    router.navigate(['/']);
    return false;
  };
