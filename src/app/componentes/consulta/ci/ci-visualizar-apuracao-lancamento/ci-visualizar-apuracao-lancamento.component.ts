import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CiService, ComunicacaoInterna } from '../../../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../../../services/funcionario.service';
import { forkJoin, of, Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-ci-visualizar-apuracao-lancamento',
  templateUrl: './ci-visualizar-apuracao-lancamento.component.html',
  styleUrls: ['./ci-visualizar-apuracao-lancamento.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CiVisualizarApuracaoLancamentoComponent implements OnInit, OnDestroy {
  respostaLancamento: 'lancado' | 'nao_lancado' | null = null;
  ci: ComunicacaoInterna | null = null;
  remetente: Funcionario | null = null;
  destinatario: Funcionario | null = null;
  matriculaLogado: string | null = null;
  dataExibicao: string | null = null;
  dataAprovacaoExibicao: string | null = null;
  perfilUsuario$: Observable<string | null>;

  private origem: string | null = null;
  private routeSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ciService: CiService,
    private funcionarioService: FuncionarioService
  ) {
    this.perfilUsuario$ = this.funcionarioService.perfilUsuario$;
  }

  ngOnInit(): void {
    this.routeSub = this.route.queryParams.subscribe(params => {
      this.origem = params['origem'];
    });

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
      ).subscribe(data => {
        this.remetente = data.remetente;
        this.destinatario = data.destinatario;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  voltar(): void {
    const matricula = this.funcionarioService.getMatriculaLogada();
    if (this.origem === 'apuracao') {
      this.router.navigate(['/ci-listar-apuracao', matricula]);
    } else if (this.origem === 'lancamento') {
      this.router.navigate(['/ci-listar-lancamento', matricula]);
    } else {
      if (matricula) {
        this.router.navigate(['/painel', matricula]);
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  sair(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
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
