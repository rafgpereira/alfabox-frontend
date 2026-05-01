/**
 * Array de imports comuns reutilizáveis em componentes standalone de CRUD.
 *
 * Uso:
 *   imports: [...SHARED_CRUD_IMPORTS, OutroComponenteEspecifico],
 *
 * Nota: Isso NÃO prejudica tree-shaking. O compilador Angular só inclui
 * no bundle o que é efetivamente usado no template de cada componente.
 */
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { ErrorMessageComponent } from '../components/error-message/error-message';
import { MultiInputComponent } from '../components/multi-input/multi-input';
import { HasRoleDirective } from '../directives/has-role.directive';
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';

export const SHARED_CRUD_IMPORTS = [
  AutoCompleteModule,
  DatePickerModule,
  FormsModule,
  ReactiveFormsModule,
  TooltipModule,
  TextareaModule,
  InputTextModule,
  DividerModule,
  FloatLabelModule,
  ButtonModule,
  TableModule,
  TagModule,
  Dialog,
  ToggleSwitch,
  SelectModule,
  SelectButtonModule,
  ErrorMessageComponent,
  MultiInputComponent,
  HasRoleDirective,
] as const;
