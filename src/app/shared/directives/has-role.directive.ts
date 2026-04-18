import { Directive, inject, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';

/**
 * Diretiva estrutural para controle de UI por role.
 *
 * Uso:
 *   <button *hasRole="'ADMIN'">Só admin vê</button>
 *   <div *hasRole="['ADMIN', 'EMPLOYEE']">Ambos veem</div>
 */
@Directive({
  selector: '[hasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit {
  @Input('hasRole') roles: string | string[] = [];

  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);

  ngOnInit(): void {
    const user = this.authService.getUser();
    const allowedRoles = Array.isArray(this.roles) ? this.roles : [this.roles];

    if (user && allowedRoles.includes(user.role)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
