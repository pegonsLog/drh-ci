import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService } from '../../../../../services/funcionario.service';
import { DocumentData, DocumentSnapshot } from '@angular/fire/firestore';

@Component({
  selector: 'app-ci-listar-aprovacao',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './ci-listar-aprovacao.component.html',
  styleUrls: ['./ci-listar-aprovacao.component.scss']
})
export class CiListarAprovacaoComponent implements OnInit {
  cis: ComunicacaoInterna[] = [];
  matricula: string | null = null;

  // Paginação
  pageSize = 10;
  lastDoc: DocumentSnapshot<DocumentData> | null = null;
  firstDoc: DocumentSnapshot<DocumentData> | null = null;
  pageNumber = 1;
  isLoading = false;
  isLastPage = false;

  constructor(
    private ciService: CiService,
    private funcionarioService: FuncionarioService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.matricula = this.funcionarioService.getMatriculaLogada();
    if (this.matricula) {
      this.loadCis('next');
    }
  }

  loadCis(direction: 'next' | 'prev'): void {
    if (this.isLoading || !this.matricula) return;
    this.isLoading = true;

    const cursor = direction === 'next' ? this.lastDoc : this.firstDoc;

    this.ciService.getCisParaAprovacaoPaginado(this.matricula, this.pageSize, direction, cursor ?? undefined)
      .subscribe({
        next: (result: { cis: ComunicacaoInterna[], firstDoc: DocumentSnapshot<DocumentData> | null, lastDoc: DocumentSnapshot<DocumentData> | null }) => {
          this.cis = result.cis.map((ci: ComunicacaoInterna) => {
            const data = ci.data as any;
            if (data && typeof data.toDate === 'function') {
              return { ...ci, data: data.toDate() };
            }
            const parsedDate = new Date(data);
            if (data && !isNaN(parsedDate.getTime())) {
              return { ...ci, data: parsedDate };
            }
            return ci;
          });

          this.firstDoc = result.firstDoc;
          this.lastDoc = result.lastDoc;
          
          this.isLastPage = result.cis.length < this.pageSize;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Falha ao carregar CIs para aprovação:', err);
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

  gerarPdfEEnviar(id: string | undefined): void {
    if (!id) return;

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      this.router.navigate(['/ci-visualizar-aprovacao', this.matricula, id], {
        queryParams: { acao: 'gerarPDF', origem: 'mobile' }
      });
    } else {
      this.router.navigate(['/ci-visualizar-aprovacao', this.matricula, id], {
        queryParams: { acao: 'gerarPDF' }
      });
    }
  }

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }
}
