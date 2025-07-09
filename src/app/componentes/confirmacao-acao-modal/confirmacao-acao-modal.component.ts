import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmacao-acao-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmacao-acao-modal.component.html',
  styleUrls: ['./confirmacao-acao-modal.component.scss']
})
export class ConfirmacaoAcaoModalComponent {
  @Input() mensagem = 'Você tem certeza que deseja executar esta ação?';
  @Output() decisao = new EventEmitter<boolean>();

  confirmar(): void {
    this.decisao.emit(true);
  }

  cancelar(): void {
    this.decisao.emit(false);
  }
}
