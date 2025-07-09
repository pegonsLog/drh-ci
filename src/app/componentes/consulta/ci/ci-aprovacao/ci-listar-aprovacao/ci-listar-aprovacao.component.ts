import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
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
  allCis: ComunicacaoInterna[] = []; // Armazena todas as CIs
  cis: ComunicacaoInterna[] = []; // Armazena as CIs da página atual
  matricula: string | null = null;
  perfil: string | null = null;

  // Paginação no lado do cliente
  pageSize = 10;
  pageNumber = 1;
  isLoading = false;
  isLastPage = false;

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
        this.loadCis();
    }
  }

  loadCis(): void {
    if (this.isLoading || !this.matricula) return;
    this.isLoading = true;

    // Espera o perfil ser definido antes de fazer a chamada
    if (!this.perfil) {
        setTimeout(() => this.loadCis(), 100); // Tenta novamente em 100ms
        return;
    }

    const isAdm = this.perfil === 'adm';
    const ciObservable = isAdm 
      ? this.ciService.getAllCisParaAprovacao() 
      : this.ciService.getCisParaAprovacao(this.matricula);

    ciObservable.subscribe({
      next: (cis) => {
        this.allCis = cis.map((ci: ComunicacaoInterna) => {
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
        this.pageNumber = 1;
        this.updatePage();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Falha ao carregar CIs para aprovação:', err);
        this.isLoading = false;
      }
    });
  }

  updatePage(): void {
    const startIndex = (this.pageNumber - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.cis = this.allCis.slice(startIndex, endIndex);
    this.isLastPage = endIndex >= this.allCis.length;
  }

  nextPage(): void {
    if (this.isLastPage) return;
    this.pageNumber++;
    this.updatePage();
  }

  previousPage(): void {
    if (this.pageNumber === 1) return;
    this.pageNumber--;
    this.updatePage();
  }

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }
}
