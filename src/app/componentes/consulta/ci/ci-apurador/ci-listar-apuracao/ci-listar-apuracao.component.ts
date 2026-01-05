import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DocumentData, DocumentSnapshot } from '@angular/fire/firestore';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService } from '../../../../../services/funcionario.service';
import { CommonModule, DatePipe } from '@angular/common';
import { StatusFormatPipe } from '../../../../../pipes/status-format.pipe';
import { ConfirmacaoExclusaoModalComponent } from '../../../../confirmacao-exclusao-modal/confirmacao-exclusao-modal.component';

import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-ci-listar-apuracao',
  standalone: true,
      imports: [CommonModule, RouterLink, DatePipe, FormsModule, StatusFormatPipe, ConfirmacaoExclusaoModalComponent],
  templateUrl: './ci-listar-apuracao.component.html',
  styleUrls: ['./ci-listar-apuracao.component.scss']
})
export class CiListarApuracaoComponent implements OnInit, OnDestroy {
  cis: ComunicacaoInterna[] = [];
  matriculaLogada: string | null = null;
  perfilUsuario: string | null = null;
  private unsubscribe$ = new Subject<void>();

  // Paginação
  pageSize = 10;
  firstDoc: DocumentSnapshot<DocumentData> | null = null;
  lastDoc: DocumentSnapshot<DocumentData> | null = null;
  pageNumber = 1;
  isLoading = false;
  isLastPage = false;
  pageCursors: { [page: number]: DocumentSnapshot<DocumentData> | null } = { 1: null };
  totalCis = 0;

  mostrarModalExclusao = false;
  ciParaExcluirId: string | undefined;
  ciDestacadoId: string | null = null;

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  constructor(
    private ciService: CiService,
    private funcionarioService: FuncionarioService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.matriculaLogada = this.funcionarioService.getMatriculaLogada();
    this.funcionarioService.perfilUsuario$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(perfil => {
      this.perfilUsuario = perfil;
    });
    
    // Captura o ID destacado dos query params
    this.route.queryParams.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(params => {
      this.ciDestacadoId = params['destacar'] || null;
      if (this.ciDestacadoId) {
        // Remove o query param após capturar
        setTimeout(() => {
          this.scrollToHighlightedRow();
        }, 500);
      }
    });
    
    this.loadCis('next');
    this.loadTotalCis();
  }

  loadCis(direction: 'next' | 'prev', fromStart: boolean = false): void {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;

    let cursor: DocumentSnapshot<DocumentData> | null | undefined = null;
    if (fromStart) {
      this.pageNumber = 1;
      this.pageCursors = { 1: null };
      this.isLastPage = false;
    } else if (direction === 'next') {
      cursor = this.lastDoc;
    } else {
      cursor = this.pageCursors[this.pageNumber];
    }

    this.ciService.getCisParaApuracaoPaginado(this.pageSize, direction, cursor ?? undefined).subscribe({
      next: result => {
        if (result.cis.length > 0) {
          this.cis = result.cis.map(ci => {
            const data = ci.data as any;
            if (data && typeof data.toDate === 'function') {
              return { ...ci, data: data.toDate() };
            }
            return ci;
          });

          this.firstDoc = result.firstDoc;
          this.lastDoc = result.lastDoc;

          if (direction === 'next' && this.lastDoc) {
            this.pageCursors[this.pageNumber + 1] = result.firstDoc;
          }
        } else if (direction === 'next') {
          this.isLastPage = true;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Falha ao carregar CIs para apuração:', err);
        this.isLoading = false;
      }
    });
  }

  nextPage(): void {
    if (this.isLastPage || !this.lastDoc) return;
    this.pageNumber++;
    this.loadCis('next');
  }

  previousPage(): void {
    if (this.pageNumber <= 1) return;
    this.pageNumber--;
    this.isLastPage = false;
    this.loadCis('prev');
  }

  loadTotalCis(): void {
    this.ciService.getTotalCisParaApuracao().subscribe(count => {
      this.totalCis = count;
    });
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

  scrollToHighlightedRow(): void {
    if (this.ciDestacadoId) {
      const element = document.getElementById(`ci-row-${this.ciDestacadoId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Remove o destaque após 3 segundos
        setTimeout(() => {
          this.ciDestacadoId = null;
        }, 3000);
      }
    }
  }
}

