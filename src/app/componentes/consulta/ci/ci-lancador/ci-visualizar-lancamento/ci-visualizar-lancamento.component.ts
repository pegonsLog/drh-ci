import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../../../../services/funcionario.service';
import { forkJoin, of, Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-ci-visualizar-lancamento',
  templateUrl: './ci-visualizar-lancamento.component.html',
  styleUrls: ['./ci-visualizar-lancamento.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CiVisualizarLancamentoComponent implements OnInit {
  respostaLancamento: 'lancado' | 'nao_lancado' | null = null;
  ci: ComunicacaoInterna | null = null;
  remetente: Funcionario | null = null;
  destinatario: Funcionario | null = null;
  matriculaLogado: string | null = null;
  dataExibicao: string | null = null;
  dataAprovacaoExibicao: string | null = null;
  perfilUsuario$: Observable<string | null>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(CiService) private ciService: CiService,
    @Inject(FuncionarioService) private funcionarioService: FuncionarioService
  ) {
    this.perfilUsuario$ = this.funcionarioService.perfilUsuario$;
  }

  ngOnInit(): void {

    this.matriculaLogado = this.funcionarioService.getMatriculaLogada();
    const ciId = this.route.snapshot.paramMap.get('id');

    if (ciId) {
      this.ciService.getCi(ciId).pipe(
        switchMap((ci: ComunicacaoInterna) => {
          if (ci) {
            this.ci = ci;
            if (!this.ci.lancamentoStatus) {
              this.ci.lancamentoStatus = 'nao_lancado';
            }
            this.respostaLancamento = this.ci.lancamentoStatus as 'lancado' | 'nao_lancado' | null;

            if (ci.data) {
              this.dataExibicao = (ci.data as any).toDate ? (ci.data as any).toDate().toLocaleDateString('pt-BR') : new Date(ci.data).toLocaleDateString('pt-BR');
            }
            if (ci.dataAprovacao) {
              this.dataAprovacaoExibicao = (ci.dataAprovacao as any).toDate ? (ci.dataAprovacao as any).toDate().toLocaleDateString('pt-BR') : new Date(ci.dataAprovacao).toLocaleDateString('pt-BR');
            }

            const remetente$ = this.funcionarioService.getFuncionarioByMatricula(String(ci.matricula));
            const destinatario$ = ci.destinatario_matricula ? this.funcionarioService.getFuncionarioByMatricula(ci.destinatario_matricula) : of({ funcionario: ci.para } as Funcionario);

            return forkJoin({ remetente: remetente$, destinatario: destinatario$ });
          }
          return of({ remetente: null, destinatario: null });
        })
      ).subscribe((data: { remetente: Funcionario | null, destinatario: Funcionario | null }) => {
        this.remetente = data.remetente;
        this.destinatario = data.destinatario;
      });
    }
  }



  voltar(): void {
    const matricula = this.funcionarioService.getMatriculaLogada();
    if (matricula) {
      this.router.navigate(['/ci-listar-lancamento', matricula]);
    } else {
      this.router.navigate(['/login']);
    }
  }

  sair(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }

  imprimirPagina(): void {
    window.print();
  }

  salvarLancamento(): void {
    if (!this.ci || !this.respostaLancamento) {
      return;
    }

    const dataLancamento = this.respostaLancamento === 'lancado' ? new Date() : undefined;

    this.ciService.updateLancamentoStatus(this.ci.id, this.respostaLancamento, dataLancamento)
      .then(() => {
        alert('Status de lançamento atualizado com sucesso!');
        if (this.ci) {
          this.ci.lancamentoStatus = this.respostaLancamento!;
          if (dataLancamento) {
            this.ci.dataLancamento = dataLancamento;
          }
        }
        this.voltar();
      })
      .catch((err: any) => {
        console.error('Erro ao salvar status de lançamento:', err);
        alert('Falha ao salvar o status de lançamento. Tente novamente.');
      });
  }
}
