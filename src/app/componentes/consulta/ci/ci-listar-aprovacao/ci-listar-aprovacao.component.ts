import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { CiService, ComunicacaoInterna } from '../../../../services/ci.service';
import { FuncionarioService } from '../../../../services/funcionario.service';


@Component({
  selector: 'app-ci-listar-aprovacao',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './ci-listar-aprovacao.component.html',
  styleUrl: './ci-listar-aprovacao.component.scss'
})

export class CiListarAprovacaoComponent implements OnInit {
  matricula: string | null = null;
  cis$!: Observable<ComunicacaoInterna[]>;

  constructor(
    private ciService: CiService,
    private router: Router,
    private route: ActivatedRoute,
    private funcionarioService: FuncionarioService
  ) { }

  ngOnInit(): void {
    this.matricula = this.funcionarioService.getMatriculaLogada();
    if (this.matricula) {
      this.cis$ = this.ciService.getCisParaAprovacao(this.matricula).pipe(
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

          // Fallback: Manter o valor original (provavelmente uma string inválida)
          return { ...ci, data: data as any };
        }))
      );
    }
  }

  editarCi(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/ci-alterar-aprovacao', this.matricula, id]);
    }
  }

  gerarPdfEEnviar(id: string | undefined): void {
    if (!id) return;

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Em dispositivos móveis, navega com um parâmetro especial para gerar o PDF sem mostrar a tela.
      this.router.navigate(['/ci-visualizar', this.matricula, id], {
        queryParams: { acao: 'gerarPDF', origem: 'mobile' }
      });
    } else {
      // Em desktop, navega normalmente para mostrar o modal de confirmação.
      this.router.navigate(['/ci-visualizar', this.matricula, id], {
        queryParams: { acao: 'gerarPDF' }
      });
    }
  }

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }
}
