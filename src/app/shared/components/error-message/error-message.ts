import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [Message],
  templateUrl: './error-message.html',
  styleUrl: './error-message.scss',
})
export class ErrorMessageComponent {
  /**
   * O controle (campo) do formulário a ser validado
   */
  @Input({ required: true }) control!: AbstractControl | null;

  /**
   * Objeto para passar mensagens customizadas.
   * Ex: { 'cpfPattern': 'CPF em formato inválido', 'required': 'Obrigatório preencher o CPF' }
   */
  @Input() customMessages: Record<string, string> = {};

  get shouldShowErrors(): boolean {
    return !!this.control && this.control.invalid && (this.control.touched || this.control.dirty);
  }

  get errorMessage(): string {
    if (!this.control || !this.control.errors) return '';

    // Pegamos a primeira chave de erro (primeira validação que falhou)
    const firstErrorKey = Object.keys(this.control.errors)[0];

    // 1. Verifica se houve override com uma mensagem customizada
    if (this.customMessages && this.customMessages[firstErrorKey]) {
      return this.customMessages[firstErrorKey];
    }

    // 2. Fallbacks para mensagens clássicas do Angular Validator
    switch (firstErrorKey) {
      case 'required':
        return 'Campo obrigatório';
      case 'email':
        return 'E-mail inválido';
      case 'minlength':
        const min = this.control.errors['minlength'].requiredLength;
        return `Mínimo de ${min} caracteres`;
      case 'maxlength':
        const max = this.control.errors['maxlength'].requiredLength;
        return `Máximo de ${max} caracteres`;
      case 'min':
        const minVal = this.control.errors['min'].min;
        return `Valor mínimo é ${minVal}`;
      case 'max':
        const maxVal = this.control.errors['max'].max;
        return `Valor máximo é ${maxVal}`;
      case 'pattern':
        return 'Formato inválido';
      default:
        return 'Campo inválido';
    }
  }
}
