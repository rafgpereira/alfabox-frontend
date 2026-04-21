import { Component, Input, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { AuthService } from '../../../shared/services/auth.service';

type AppMenuItem = MenuItem & {
  roles?: ('ADMIN' | 'EMPLOYEE')[];
  items?: AppMenuItem[];
};

@Component({
  selector: 'app-sidebar',
  imports: [PanelMenuModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  @Input() isExpanded = false;

  items: AppMenuItem[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getUser();

    const menu: AppMenuItem[] = [
      {
        label: 'Ordem de Serviço',
        icon: 'pi pi-fw pi-briefcase',
        routerLink: '/os',
      },
      {
        label: 'Cadastro',
        icon: 'pi pi-fw pi-file-edit',
        items: [
          {
            label: 'Clientes',
            icon: 'pi pi-fw pi-users',
            routerLink: '/cadastro/clientes',
          },
          {
            label: 'Produtos',
            icon: 'pi pi-fw pi-box',
            routerLink: '/cadastro/produtos',
            roles: ['ADMIN'],
          },
          {
            label: 'Montadores',
            icon: 'pi pi-fw pi-wrench',
            routerLink: '/cadastro/montadores',
            roles: ['ADMIN'],
          },
          {
            label: 'Vendedores',
            icon: 'pi pi-fw pi-id-card',
            routerLink: '/cadastro/vendedores',
            roles: ['ADMIN'],
          },
        ],
      },
    ];

    this.items = this.filterMenuByRole(menu, user?.role);
  }

  private filterMenuByRole(items: AppMenuItem[], role?: string): AppMenuItem[] {
    return items
      .map((item) => {
        const newItem: AppMenuItem = { ...item };

        if (newItem.items) {
          newItem.items = this.filterMenuByRole(newItem.items, role);
        }

        return newItem;
      })
      .filter((item) => {
        if (item.roles) {
          return role && item.roles.includes(role as any);
        }

        return true;
      })
      .filter((item) => {
        if (item.items) {
          return item.items.length > 0;
        }
        return true;
      });
  }
}
