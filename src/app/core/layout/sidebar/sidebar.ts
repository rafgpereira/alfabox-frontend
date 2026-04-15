import { Component, Input, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';

@Component({
  selector: 'app-sidebar',
  imports: [PanelMenuModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  @Input() isExpanded = false;

  items: MenuItem[] = [];

  ngOnInit() {
    this.items = [
      {
        label: 'Cadastro',
        icon: 'pi pi-fw pi-file-edit',
        items: [
          { label: 'Clientes', icon: 'pi pi-fw pi-users', routerLink: '/cadastro/clientes' },
          { label: 'Produtos', icon: 'pi pi-fw pi-box', routerLink: '/cadastro/produtos' },
          { label: 'Montadores', icon: 'pi pi-fw pi-wrench', routerLink: '/cadastro/montadores' },
          { label: 'Vendedores', icon: 'pi pi-fw pi-id-card', routerLink: '/cadastro/vendedores' },
        ],
      },
    ];
  }
}
