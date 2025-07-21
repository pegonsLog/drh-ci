import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DocumentData, DocumentSnapshot } from '@angular/fire/firestore';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService } from '../../../../../services/funcionario.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { StatusFormatPipe } from '../../../../../pipes/status-format.pipe';

@Component({
  selector: 'app-ci-listar-lancamento',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule, StatusFormatPipe],
  templateUrl: './ci-listar-lancamento.component.html',
  styleUrls: ['./ci-listar-lancamento.component.scss']
})
export class CiListarLancamentoComponent implements OnInit, OnDestroy {
  cis: ComunicacaoInterna[] = [];
  matriculaLogada: string | null = null;
  perfilUsuario: string | null = null;
  private unsubscribe$ = new Subject<void>();
  totalCis = 0;

  // Paginação
  pageSize = 10;
  firstDoc: DocumentSnapshot<DocumentData> | null = null;
  lastDoc: DocumentSnapshot<DocumentData> | null = null;
  pageNumber = 1;
  isLoading = false;
  isLastPage = false;
  pageCursors: { [page: number]: DocumentSnapshot<DocumentData> | null } = { 1: null };

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  constructor(
    private ciService: CiService,
    private router: Router,
    private funcionarioService: FuncionarioService
  ) { }

  ngOnInit(): void {
    this.matriculaLogada = this.funcionarioService.getMatriculaLogada();
    this.funcionarioService.perfilUsuario$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(perfil => {
      this.perfilUsuario = perfil;
    });
    this.loadCis('next');
    this.loadTotalCis();
  }

  loadCis(direction: 'next' | 'prev'): void {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;

    let cursor: DocumentSnapshot<DocumentData> | null | undefined = null;
    if (direction === 'next') {
      cursor = this.lastDoc;
    } else {
      // Para 'prev', usamos o cursor da página para a qual estamos navegando
      cursor = this.pageCursors[this.pageNumber];
    }

    this.ciService.getCisParaLancamentoPaginado(this.pageSize, direction, cursor ?? undefined).subscribe(result => {
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
          // Armazena o primeiro documento da *próxima* página para poder voltar a ela
          this.pageCursors[this.pageNumber + 1] = result.firstDoc;
        }
      } else if (direction === 'next') {
        this.isLastPage = true;
      }

      this.isLoading = false;
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
    this.isLastPage = false; // Se voltamos, não estamos mais na última página
    this.loadCis('prev');
  }

  loadTotalCis(): void {
    this.ciService.getTotalCisParaLancamento().subscribe(count => {
      this.totalCis = count;
    });
  }

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }

  onImpressaChange(ci: ComunicacaoInterna, event: any): void {
    const impressa = event.target.checked;
    this.ciService.updateImpressaStatus(ci.id, impressa).catch(err => {
      console.error('Erro ao atualizar status de impressão:', err);
      // Opcional: reverter o estado do checkbox em caso de erro
      event.target.checked = !impressa;
    });
  }
}
