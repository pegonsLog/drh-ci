import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
export class CiListarAprovacaoComponent implements OnInit {
  cis: ComunicacaoInterna[] = [];
  matricula: string | null = null;
  perfil: string | null = null;

  // Paginação no lado do servidor
  pageSize = 10;
  pageNumber = 1;
  isLoading = false;
  isLastPage = false;
  firstDoc: DocumentSnapshot<DocumentData> | null = null;
  lastDoc: DocumentSnapshot<DocumentData> | null = null;

  constructor(
    private ciService: CiService,
    public funcionarioService: FuncionarioService, // Tornar público para uso no template
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.matricula = this.funcionarioService.getMatriculaLogada();
    this.funcionarioService.perfilUsuario$.subscribe(perfil => {
      this.perfil = perfil;
      // Recarregar os dados se o perfil for carregado após a matrícula
      if (this.matricula) {
        this.loadCis();
      }
    });
    if (this.matricula && !this.perfil) {
        // A chamada inicial agora acontece dentro do subscribe do perfil
    }
  }

  loadCis(direction: 'next' | 'prev' = 'next'): void {
    if (this.isLoading || !this.matricula || !this.perfil) return;
    this.isLoading = true;

    const cursor = direction === 'next' ? this.lastDoc : this.firstDoc;

    this.ciService.getCisParaAprovacaoPaginado(this.matricula, this.perfil, this.pageSize, direction, cursor ?? undefined).subscribe({
      next: (result) => {
        this.cis = result.cis.map((ci: ComunicacaoInterna) => {
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

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }
}
