import { Component, EventEmitter, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-header',
  imports: [ButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Output() toggleSidebar = new EventEmitter<void>();
  
  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
}
