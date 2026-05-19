import { Directive, OnDestroy, OnInit, inject } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { Subscription } from 'rxjs';

/**
 * Diretiva aplicada automaticamente a todos os `<p-dialog>` que resolvem dois problemas de UX:
 *
 * 1. **Tab inicia nos campos do formulário**: insere um sentinel invisível no início do
 *    conteúdo do dialog. O foco inicial é colocado nesse sentinel, de modo que ao pressionar
 *    Tab o navegador vai naturalmente para o primeiro campo do formulário (não para os botões
 *    do footer). O sentinel é removido após o primeiro Tab para não permanecer no ciclo.
 *
 * 2. **Enter para confirmar**: ao pressionar Enter dentro do dialog (exceto em textareas e
 *    quando algum overlay do PrimeNG está aberto), o último botão do footer é clicado —
 *    convencionalmente o botão "Salvar". Se estiver desabilitado, o clique é ignorado
 *    nativamente pelo navegador.
 */
@Directive({
  selector: 'p-dialog',
  standalone: true,
})
export class DialogKeyboardDirective implements OnInit, OnDestroy {
  private dialog = inject(Dialog);
  private showSub?: Subscription;
  private hideSub?: Subscription;
  private keydownHandler?: (e: KeyboardEvent) => void;
  private sentinel?: HTMLSpanElement;

  ngOnInit(): void {
    this.showSub = this.dialog.onShow.subscribe(() => this.onDialogShow());
    this.hideSub = this.dialog.onHide.subscribe(() => this.onDialogHide());
  }

  ngOnDestroy(): void {
    this.showSub?.unsubscribe();
    this.hideSub?.unsubscribe();
    this.removeSentinel();
    this.cleanupKeydownListener();
  }

  private onDialogShow(): void {
    const container = this.dialog.container;
    if (!container) return;

    // Insere um sentinel invisível no início do conteúdo do dialog.
    // Ao focar o sentinel e pressionar Tab, o foco vai naturalmente para o
    // primeiro campo do formulário — sem autofoco em nenhum campo ao abrir.
    const content = container.querySelector<HTMLElement>('.p-dialog-content');
    if (content) {
      this.removeSentinel();
      this.sentinel = document.createElement('span');
      this.sentinel.tabIndex = 0;
      this.sentinel.setAttribute('aria-hidden', 'true');
      this.sentinel.style.cssText =
        'position:absolute;width:1px;height:0;padding:0;overflow:hidden;opacity:0;pointer-events:none;outline:none';
      content.insertBefore(this.sentinel, content.firstChild);
      this.sentinel.focus({ preventScroll: true });

      // Remove o sentinel após o primeiro Tab para não permanecer no ciclo de foco
      const onSentinelKeydown = (e: KeyboardEvent): void => {
        if (e.key === 'Tab') {
          this.sentinel?.removeEventListener('keydown', onSentinelKeydown);
          setTimeout(() => this.removeSentinel(), 0);
        }
      };
      this.sentinel.addEventListener('keydown', onSentinelKeydown);
    }

    // Registra o handler de Enter no container do dialog
    this.cleanupKeydownListener();
    this.keydownHandler = (e: KeyboardEvent) => this.onContainerKeydown(e, container);
    container.addEventListener('keydown', this.keydownHandler);
  }

  private onDialogHide(): void {
    this.removeSentinel();
    this.cleanupKeydownListener();
  }

  private onContainerKeydown(e: KeyboardEvent, container: HTMLElement): void {
    if (e.key !== 'Enter') return;

    const target = e.target as HTMLElement;
    // Não submeter ao pressionar Enter em textarea (comportamento nativo esperado)
    if (target.tagName === 'TEXTAREA') return;

    // Não submeter se um overlay do PrimeNG estiver aberto (datepicker, select, etc.)
    if (
      document.querySelector(
        '.p-datepicker-panel, .p-select-list-container, .p-multiselect-overlay, .p-autocomplete-panel',
      )
    )
      return;

    // Clica o último botão do footer (convencionalmente "Salvar").
    // Se o botão estiver desabilitado, o clique é ignorado nativamente.
    const footer = container.querySelector('.p-dialog-footer');
    if (!footer) return;
    const buttons = footer.querySelectorAll<HTMLButtonElement>('button');
    if (buttons.length === 0) return;

    e.preventDefault();
    buttons[buttons.length - 1].click();
  }

  private removeSentinel(): void {
    this.sentinel?.remove();
    this.sentinel = undefined;
  }

  private cleanupKeydownListener(): void {
    const container = this.dialog.container;
    if (container && this.keydownHandler) {
      container.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = undefined;
    }
  }
}
