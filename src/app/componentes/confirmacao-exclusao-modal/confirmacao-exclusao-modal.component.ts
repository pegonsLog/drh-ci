import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmacao-exclusao-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmacao-exclusao-modal.component.html',
  styleUrls: ['./confirmacao-exclusao-modal.component.scss']
})
export class ConfirmacaoExclusaoModalComponent {
  @Output() decisao = new EventEmitter<boolean>();

  confirmar(): void {
    this.decisao.emit(true);
  }

  cancelar(): void {
    this.decisao.emit(false);
  }
}
