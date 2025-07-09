import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DocumentData, DocumentSnapshot } from '@angular/fire/firestore';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService } from '../../../../../services/funcionario.service';
import { CommonModule, DatePipe } from '@angular/common';
import { StatusFormatPipe } from '../../../../../pipes/status-format.pipe';
import { ConfirmacaoExclusaoModalComponent } from '../../../../confirmacao-exclusao-modal/confirmacao-exclusao-modal.component';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ci-listar-apuracao',
  standalone: true,
      imports: [CommonModule, RouterLink, DatePipe, FormsModule, StatusFormatPipe, ConfirmacaoExclusaoModalComponent],
  templateUrl: './ci-listar-apuracao.component.html',
  styleUrls: ['./ci-listar-apuracao.component.scss']
})
export class CiListarApuracaoComponent implements OnInit {
  cis: ComunicacaoInterna[] = [];
  matriculaLogada: string | null = null;
  perfilUsuario: string | null = null;

  // Paginação
  pageSize = 10;
  firstDoc: DocumentSnapshot<DocumentData> | null = null;
  lastDoc: DocumentSnapshot<DocumentData> | null = null;
  pageNumber = 1;
  isLoading = false;
    isLastPage = false;

  mostrarModalExclusao = false;
  ciParaExcluirId: string | undefined;

  constructor(
    private ciService: CiService,
    private funcionarioService: FuncionarioService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.matriculaLogada = this.funcionarioService.getMatriculaLogada();
    this.funcionarioService.perfilUsuario$.subscribe(perfil => {
      this.perfilUsuario = perfil;
    });
    this.loadCis('next');
  }

  loadCis(direction: 'next' | 'prev', fromStart: boolean = false): void {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;

    const cursor = fromStart ? null : (direction === 'next' ? this.lastDoc : this.firstDoc);

    this.ciService.getCisParaApuracaoPaginado(this.pageSize, direction, cursor ?? undefined).subscribe({
      next: result => {
        this.cis = result.cis.map(ci => {
          const data = ci.data as any;
          if (data && typeof data.toDate === 'function') {
            return { ...ci, data: data.toDate() };
          }
          return ci;
        });

        this.firstDoc = result.firstDoc;
        this.lastDoc = result.lastDoc;
        this.isLastPage = result.cis.length < this.pageSize;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Falha ao carregar CIs para apuração:', err);
        this.isLoading = false;
      }
    });
  }

  nextPage(): void {
    if (this.isLastPage) return;
    this.pageNumber++;
    this.loadCis('next');
  }

  previousPage(): void {
    if (this.pageNumber === 1) return;
    this.pageNumber--;
    this.loadCis('prev');
  }

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }

  excluirCi(id: string | undefined): void {
    this.ciParaExcluirId = id;
    this.mostrarModalExclusao = true;
  }

  onDecisaoModal(confirmado: boolean): void {
    if (confirmado && this.ciParaExcluirId) {
      const idParaExcluir = this.ciParaExcluirId;
      this.ciService.deleteCi(idParaExcluir)
        .then(() => {
          this.cis = this.cis.filter(ci => ci.id !== idParaExcluir);

          // Se a página atual ficar vazia após a exclusão e não for a primeira página,
          // carrega a página anterior.
          if (this.cis.length === 0 && this.pageNumber > 1) {
            this.previousPage();
          }
        })
        .catch(err => {
          console.error('Erro ao excluir CI:', err);
          alert('Ocorreu um erro ao excluir a comunicação.');
        });
    }
    this.mostrarModalExclusao = false;
    this.ciParaExcluirId = undefined;
  }
}

