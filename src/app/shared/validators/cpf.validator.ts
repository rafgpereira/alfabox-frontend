import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Valida um CPF (apenas dígitos ou formatado).
 * Retorna true se o CPF for válido.
 */
export function isValidCpf(value: string | null | undefined): boolean {
  if (!value) return false;

  const cpf = value.replace(/\D/g, '');

  if (cpf.length !== 11) return false;

  // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Valida dígitos verificadores
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) {
      sum += Number(cpf[i]) * (t + 1 - i);
    }
    const digit = ((sum * 10) % 11) % 10;
    if (Number(cpf[t]) !== digit) return false;
  }

  return true;
}

/**
 * ValidatorFn do Angular para campos de CPF.
 * Uso: formControl: ['', [Validators.required, cpfValidator]]
 */
export const cpfValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) return null; // deixa o required cuidar do vazio
  return isValidCpf(control.value) ? null : { invalidCpf: true };
};
