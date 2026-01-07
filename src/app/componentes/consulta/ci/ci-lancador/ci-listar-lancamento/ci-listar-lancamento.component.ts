import { Component, OnDestroy, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
export class CiListarLancamentoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef;
  @ViewChild('tableContainer') tableContainer!: ElementRef;
  private intersectionObserver!: IntersectionObserver;

  cis: ComunicacaoInterna[] = [];
  cisFiltrados: ComunicacaoInterna[] = [];
  matriculaLogada: string | null = null;
  perfilUsuario: string | null = null;
  private unsubscribe$ = new Subject<void>();
  totalCis = 0;

  // Filtros
  filtroFuncionario: string = '';
  filtroComunicacao: string = '';
  todosCarregados: boolean = false;
  allCis: ComunicacaoInterna[] = [];

  // Scroll infinito
  pageSize = 8;
  lastDoc: DocumentSnapshot<DocumentData> | null = null;
  isLoading = false;
  isLastPage = false;
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
    private router: Router,
    private funcionarioService: FuncionarioService,
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
        setTimeout(() => {
          this.scrollToHighlightedRow();
        }, 500);
      }
    });
    
    this.loadCis();
    this.loadTotalCis();
  }

  loadCis(): void {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;

    this.ciService.getCisParaLancamentoPaginado(this.pageSize, 'next', undefined).subscribe(result => {
      this.cis = result.cis.map(ci => {
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
    });
  }

  loadMoreCis(): void {
    if (this.isLoading || this.isLastPage || !this.lastDoc) return;
    this.isLoading = true;

    this.ciService.getCisParaLancamentoPaginado(this.pageSize, 'next', this.lastDoc).subscribe(result => {
      const newCis = result.cis.map(ci => {
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
    });
  }

  aplicarFiltros(): void {
    const temFiltro = this.filtroFuncionario.trim() || this.filtroComunicacao.trim();
    
    if (temFiltro && !this.todosCarregados) {
      // Carregar todos os dados para filtrar
      this.isLoading = true;
      this.ciService.getCisParaLancamento().subscribe({
        next: (cis) => {
          this.allCis = cis.map(ci => {
            const data = ci.data as any;
            if (data && typeof data.toDate === 'function') {
              return { ...ci, data: data.toDate() };
            }
            return ci;
          });
          this.todosCarregados = true;
          this.filtrarDados();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erro ao carregar todos os CIs:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.filtrarDados();
    }
  }

  private filtrarDados(): void {
    const temFiltro = this.filtroFuncionario.trim() || this.filtroComunicacao.trim();
    let resultado = temFiltro ? [...this.allCis] : [...this.cis];

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
    this.cisFiltrados = [...this.cis];
    setTimeout(() => this.observeSentinel(), 100);
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
