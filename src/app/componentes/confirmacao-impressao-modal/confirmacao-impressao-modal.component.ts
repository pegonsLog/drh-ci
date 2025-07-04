import { Component, EventEmitter, Output } from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmacao-impressao-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmacao-impressao-modal.component.html',
  styleUrls: ['./confirmacao-impressao-modal.component.scss']
})
export class ConfirmacaoImpressaoModalComponent {
  @Output() decisao = new EventEmitter<boolean>();
  @Output() modalFechado = new EventEmitter<void>();

  escolher(comCopia: boolean): void {
    this.decisao.emit(comCopia);
  }

  fechar(): void {
    this.modalFechado.emit();
  }
}
