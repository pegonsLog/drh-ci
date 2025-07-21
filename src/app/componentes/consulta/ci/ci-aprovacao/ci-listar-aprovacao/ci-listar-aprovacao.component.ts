import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { DocumentData, DocumentSnapshot } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService } from '../../../../../services/funcionario.service';

import { StatusFormatPipe } from '../../../../../pipes/status-format.pipe';

@Component({
  selector: 'app-ci-listar-aprovacao',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule, DatePipe, StatusFormatPipe],
  templateUrl: './ci-listar-aprovacao.component.html',
  styleUrls: ['./ci-listar-aprovacao.component.scss']
})
export class CiListarAprovacaoComponent implements OnInit, OnDestroy {
  cis: ComunicacaoInterna[] = [];
  matricula: string | null = null;
  perfil: string = '';
  private unsubscribe$ = new Subject<void>();

  // Paginação no lado do servidor
  pageSize = 10;
  pageNumber = 1;
  isLoading = false;
  isLastPage = false;
  firstDoc: DocumentSnapshot<DocumentData> | null = null;
  lastDoc: DocumentSnapshot<DocumentData> | null = null;
  pageCursors: { [page: number]: DocumentSnapshot<DocumentData> | null } = { 1: null };
  totalCis = 0;

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  constructor(
    private ciService: CiService,
    public funcionarioService: FuncionarioService, // Tornar público para uso no template
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.matricula = this.funcionarioService.getMatriculaLogada();
    if (!this.matricula) {
      this.router.navigate(['/login']);
      return;
    }

    this.funcionarioService.perfilUsuario$.pipe(
      filter((perfil): perfil is string => perfil !== null),
      takeUntil(this.unsubscribe$)
    ).subscribe(perfil => {
      this.perfil = perfil;
      this.loadCis('next');
      this.loadTotalCis();
    });
  }

  loadCis(direction: 'next' | 'prev' = 'next'): void {
    if (this.isLoading || !this.matricula || !this.perfil) return;
    this.isLoading = true;

    let cursor: DocumentSnapshot<DocumentData> | null | undefined = null;
    if (direction === 'next') {
      cursor = this.lastDoc;
    } else {
      cursor = this.pageCursors[this.pageNumber];
    }

    this.ciService.getCisParaAprovacaoPaginado(this.matricula, this.perfil, this.pageSize, direction, cursor ?? undefined).subscribe({
      next: (result) => {
        if (result.cis.length > 0) {
          this.cis = result.cis.map((ci: ComunicacaoInterna) => {
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
        console.error('Falha ao carregar CIs para aprovação:', err);
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
    if (this.matricula && this.perfil) {
      this.ciService.getTotalCisParaAprovacao(this.matricula, this.perfil).subscribe(count => {
        this.totalCis = count;
      });
    }
  }

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }
}
