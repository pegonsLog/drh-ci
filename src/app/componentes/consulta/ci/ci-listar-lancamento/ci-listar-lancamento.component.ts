import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DocumentData, DocumentSnapshot } from '@angular/fire/firestore';
import { CiService, ComunicacaoInterna } from '../../../../services/ci.service';
import { FuncionarioService } from '../../../../services/funcionario.service';

@Component({
  selector: 'app-ci-listar-lancamento',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './ci-listar-lancamento.component.html',
  styleUrls: ['./ci-listar-lancamento.component.scss']
})
export class CiListarLancamentoComponent implements OnInit {
  cis: ComunicacaoInterna[] = [];
  matriculaLogada: string | null = null;

  // Paginação
  pageSize = 10;
  lastDoc: DocumentSnapshot<DocumentData> | null = null;
  firstDoc: DocumentSnapshot<DocumentData> | null = null;
  pageNumber = 1;
  isLoading = false;
  isLastPage = false;

  constructor(
    private ciService: CiService,
    private router: Router,
    private funcionarioService: FuncionarioService
  ) { }

  ngOnInit(): void {
    this.matriculaLogada = this.funcionarioService.getMatriculaLogada();
    this.loadCis('next');
  }

  loadCis(direction: 'next' | 'prev'): void {
    if (this.isLoading) return;
    this.isLoading = true;

    const cursor = direction === 'next' ? this.lastDoc : this.firstDoc;

    this.ciService.getCisParaLancamento(this.pageSize, direction, cursor ?? undefined).subscribe(result => {
      this.cis = result.cis.map(ci => {
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

  editarCi(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/ci-alterar-lancamento', id]);
    }
  }

  onLancamento(ci: ComunicacaoInterna): void {
    // Lógica para lançamento
    this.router.navigate(['/ci-lancamento', ci.id]);
  }

  gerarPdfEEnviar(id: string | undefined): void {
    if (!id || !this.matriculaLogada) return;

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Em dispositivos móveis, navega com um parâmetro especial para gerar o PDF sem mostrar a tela.
      this.router.navigate(['/ci-visualizar', this.matriculaLogada, id], {
        queryParams: { acao: 'gerarPDF', origem: 'mobile' }
      });
    } else {
      // Em desktop, navega normalmente para mostrar o modal de confirmação.
      this.router.navigate(['/ci-visualizar', this.matriculaLogada, id], {
        queryParams: { acao: 'gerarPDF' }
      });
    }
  }

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }
}
