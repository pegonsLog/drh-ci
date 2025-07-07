import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DocumentData, DocumentSnapshot } from '@angular/fire/firestore';
import { CiService, ComunicacaoInterna } from '../../../../services/ci.service';
import { FuncionarioService } from '../../../../services/funcionario.service';
import { ReplacePipe } from '../../../../pipes/replace.pipe';

@Component({
  selector: 'app-ci-listar-apuracao',
  standalone: true,
    imports: [CommonModule, RouterLink, DatePipe, ReplacePipe],
  templateUrl: './ci-listar-apuracao.component.html',
  styleUrl: './ci-listar-apuracao.component.scss'
})
export class CiListarApuracaoComponent implements OnInit {
  matricula: string | null = null;
  cis: ComunicacaoInterna[] = [];

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
    this.matricula = this.funcionarioService.getMatriculaLogada();
    this.loadCis('next');
  }

  loadCis(direction: 'next' | 'prev'): void {
    if (this.isLoading) return;
    this.isLoading = true;

    const cursor = direction === 'next' ? this.lastDoc : this.firstDoc;

    this.ciService.getCisParaApuracao(this.pageSize, direction, cursor ?? undefined).subscribe(result => {
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

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }
}
