import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
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
  cis$!: Observable<ComunicacaoInterna[]>;

  constructor(
    private ciService: CiService,
    private router: Router,
    private funcionarioService: FuncionarioService
  ) { }

  ngOnInit(): void {
    this.cis$ = this.ciService.getCisParaLancamento().pipe(
      map(cis => cis.map(ci => {
        const data = ci.data as any;

        // Prioridade 1: Timestamp do Firestore
        if (data && typeof data.toDate === 'function') {
          return { ...ci, data: data.toDate() };
        }

        // Prioridade 2: String ou número que pode ser convertido para uma data válida
        const parsedDate = new Date(data);
        if (data && !isNaN(parsedDate.getTime())) {
          return { ...ci, data: parsedDate };
        }

        // Fallback: retorna o objeto original se a data for inválida ou nula
        return ci;
      }))
    );
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
    if (!id) return;

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Em dispositivos móveis, navega com um parâmetro especial para gerar o PDF sem mostrar a tela.
      this.router.navigate(['/ci-visualizar', id], {
        queryParams: { acao: 'gerarPDF', origem: 'mobile' }
      });
    } else {
      // Em desktop, navega normalmente para mostrar o modal de confirmação.
      this.router.navigate(['/ci-visualizar', id], {
        queryParams: { acao: 'gerarPDF' }
      });
    }
  }

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }
}
