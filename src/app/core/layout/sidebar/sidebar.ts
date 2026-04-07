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
  @Input() isExpanded: boolean = false;

  items: MenuItem[] = [];

  ngOnInit() {
    this.items = [
      {
        label: 'Cadastro',
        icon: 'pi pi-fw pi-file-edit',
        items: [
          { label: 'Clientes', icon: 'pi pi-fw pi-users' },
          { label: 'Produtos', icon: 'pi pi-fw pi-box' },
          { label: 'Montadores', icon: 'pi pi-fw pi-wrench' },
          { label: 'Vendedores', icon: 'pi pi-fw pi-id-card' },
        ],
      },
    ];
  }
}
