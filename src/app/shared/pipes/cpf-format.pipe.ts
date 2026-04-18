import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formata uma string de 11 dígitos como CPF: 000.000.000-00
 * Uso: {{ '12345678901' | cpfFormat }}
 */
@Pipe({ name: 'cpfFormat' })
export class CpfFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 11) return value;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
}
