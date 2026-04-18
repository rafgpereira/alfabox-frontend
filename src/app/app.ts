import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopup } from 'primeng/confirmpopup';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule, ConfirmPopup],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App {
  /** título do app */
  protected readonly title = signal('Alfabox');
}
