import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
export class CiListarAprovacaoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef;
  @ViewChild('tableContainer') tableContainer!: ElementRef;
  private intersectionObserver!: IntersectionObserver;

  cis: ComunicacaoInterna[] = [];
  cisFiltrados: ComunicacaoInterna[] = [];
  matricula: string | null = null;
  perfil: string = '';
  private unsubscribe$ = new Subject<void>();

  // Filtros
  filtroFuncionario: string = '';
  filtroComunicacao: string = '';

  // Scroll infinito
  pageSize = 8;
  isLoading = false;
  isLastPage = false;
  lastDoc: DocumentSnapshot<DocumentData> | null = null;
  totalCis = 0;
  ciDestacadoId: string | null = null;

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  constructor(
    private ciService: CiService,
    public funcionarioService: FuncionarioService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver(): void {
    const options = {
      root: this.tableContainer?.nativeElement || null,
      threshold: 0.1
    };
    
    this.intersectionObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.isLoading && !this.isLastPage) {
        this.loadMoreCis();
      }
    }, options);
  }

  private observeSentinel(): void {
    if (this.scrollSentinel && this.intersectionObserver) {
      this.intersectionObserver.observe(this.scrollSentinel.nativeElement);
    }
  }

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
      this.loadCis();
      this.loadTotalCis();
    });

    // Captura o ID destacado dos query params
    this.route.queryParams.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(params => {
      this.ciDestacadoId = params['destacar'] || null;
      if (this.ciDestacadoId) {
        setTimeout(() => {
          this.scrollToHighlightedRow();
        }, 500);
      }
    });
  }

  loadCis(): void {
    if (this.isLoading || !this.matricula || !this.perfil) return;
    this.isLoading = true;

    this.ciService.getCisParaAprovacaoPaginado(this.matricula, this.perfil, this.pageSize, 'next', undefined).subscribe({
      next: (result) => {
        this.cis = result.cis.map((ci: ComunicacaoInterna) => {
          const data = ci.data as any;
          if (data && typeof data.toDate === 'function') {
            return { ...ci, data: data.toDate() };
          }
          return ci;
        });

        this.lastDoc = result.lastDoc;
        this.aplicarFiltros();
        
        if (result.cis.length < this.pageSize) {
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

  loadMoreCis(): void {
    if (this.isLoading || this.isLastPage || !this.lastDoc || !this.matricula || !this.perfil) return;
    this.isLoading = true;

    this.ciService.getCisParaAprovacaoPaginado(this.matricula, this.perfil, this.pageSize, 'next', this.lastDoc).subscribe({
      next: (result) => {
        const newCis = result.cis.map((ci: ComunicacaoInterna) => {
          const data = ci.data as any;
          if (data && typeof data.toDate === 'function') {
            return { ...ci, data: data.toDate() };
          }
          return ci;
        });
        this.cis = [...this.cis, ...newCis];
        this.lastDoc = result.lastDoc;
        this.aplicarFiltros();
        
        if (result.cis.length < this.pageSize) {
          this.isLastPage = true;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Falha ao carregar mais CIs para aprovação:', err);
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros(): void {
    let resultado = [...this.cis];

    if (this.filtroFuncionario.trim()) {
      const termo = this.filtroFuncionario.toLowerCase().trim();
      resultado = resultado.filter(ci => 
        ci.de?.toLowerCase().includes(termo) || 
        ci.para?.toLowerCase().includes(termo)
      );
    }

    if (this.filtroComunicacao.trim()) {
      const termo = this.filtroComunicacao.toLowerCase().trim();
      resultado = resultado.filter(ci => 
        ci.comunicacao?.toLowerCase().includes(termo)
      );
    }

    this.cisFiltrados = resultado;
    
    // Re-observar o sentinel após atualizar a lista
    setTimeout(() => this.observeSentinel(), 100);
  }

  limparFiltros(): void {
    this.filtroFuncionario = '';
    this.filtroComunicacao = '';
    this.aplicarFiltros();
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

  scrollToHighlightedRow(): void {
    if (this.ciDestacadoId) {
      const element = document.getElementById(`ci-row-${this.ciDestacadoId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          this.ciDestacadoId = null;
        }, 3000);
      }
    }
  }
}
