import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../../../../services/funcionario.service';
import { forkJoin, of, Observable, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmacaoAcaoModalComponent } from '../../../../confirmacao-acao-modal/confirmacao-acao-modal.component';

@Component({
  selector: 'app-ci-visualizar-lancamento',
  templateUrl: './ci-visualizar-lancamento.component.html',
  styleUrls: ['./ci-visualizar-lancamento.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmacaoAcaoModalComponent
  ]
})
export class CiVisualizarLancamentoComponent implements OnInit {
  respostaLancamento: 'lancado' | 'pendente' | null = null;
  ci: ComunicacaoInterna | null = null;
  remetente: Funcionario | null = null;
  destinatario: Funcionario | null = null;
  lancador: Funcionario | null = null;
  gerenteAprovador: Funcionario | null = null;
  matriculaLogado: string | null = null;
  dataExibicao: string | null = null;
  dataAprovacaoExibicao: string | null = null;
  dataLancamentoExibicao: string | null = null;
  dataAprovacaoGerenteExibicao: string | null = null;
  perfilUsuario$: Observable<string | null>;

  // Controle do Modal de Confirmação de Ação
  mostrarModalAcao = false;
  mensagemModalAcao = '';
  private acaoPendente: (() => void) | null = null;

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
              this.ci.lancamentoStatus = 'pendente';
            }
            this.respostaLancamento = this.ci.lancamentoStatus as 'lancado' | 'pendente' | null;

            if (ci.data) {
              this.dataExibicao = (ci.data as any).toDate ? (ci.data as any).toDate().toLocaleDateString('pt-BR') : new Date(ci.data).toLocaleDateString('pt-BR');
            }
            if (ci.dataAprovacao) {
              this.dataAprovacaoExibicao = (ci.dataAprovacao as any).toDate ? (ci.dataAprovacao as any).toDate().toLocaleDateString('pt-BR') : new Date(ci.dataAprovacao).toLocaleDateString('pt-BR');
            }

            if (ci.dataLancamento) {
              this.dataLancamentoExibicao = (ci.dataLancamento as any).toDate ? (ci.dataLancamento as any).toDate().toLocaleDateString('pt-BR') : new Date(ci.dataLancamento).toLocaleDateString('pt-BR');
            }

            if (ci.data_aprovacao_gerente) {
              this.dataAprovacaoGerenteExibicao = (ci.data_aprovacao_gerente as any).toDate ? (ci.data_aprovacao_gerente as any).toDate().toLocaleDateString('pt-BR') : new Date(ci.data_aprovacao_gerente).toLocaleDateString('pt-BR');
            }

            const remetente$ = this.funcionarioService.getFuncionarioByMatricula(String(ci.matricula));
            const destinatario$ = ci.destinatario_matricula ? this.funcionarioService.getFuncionarioByMatricula(ci.destinatario_matricula) : of({ funcionario: ci.para } as Funcionario);
            const lancador$ = ci.lancador_matricula ? this.funcionarioService.getFuncionarioByMatricula(ci.lancador_matricula) : of(null);
            const gerenteAprovador$ = ci.gerente_aprovador_matricula ? this.funcionarioService.getFuncionarioByMatricula(ci.gerente_aprovador_matricula) : of(null);

            return forkJoin({ remetente: remetente$, destinatario: destinatario$, lancador: lancador$, gerenteAprovador: gerenteAprovador$ });
          }
          return of({ remetente: null, destinatario: null, lancador: null, gerenteAprovador: null });
        })
      ).subscribe((data: { remetente: Funcionario | null, destinatario: Funcionario | null, lancador: Funcionario | null, gerenteAprovador: Funcionario | null }) => {
        this.remetente = data.remetente;
        this.destinatario = data.destinatario;
        this.lancador = data.lancador;
        this.gerenteAprovador = data.gerenteAprovador;
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

  abrirModalConfirmacao(acao: () => void, mensagem: string): void {
    this.acaoPendente = acao;
    this.mensagemModalAcao = mensagem;
    this.mostrarModalAcao = true;
  }

  processarDecisaoAcao(confirmado: boolean): void {
    this.mostrarModalAcao = false;
    if (confirmado && this.acaoPendente) {
      this.acaoPendente();
    }
    this.acaoPendente = null;
  }

  salvarLancamento(): void {
    const acao = () => {
      if (!this.ci || !this.respostaLancamento) return;

      const dataLancamento = this.respostaLancamento === 'lancado' ? new Date() : undefined;
      const lancadorMatricula = this.respostaLancamento === 'lancado' ? this.matriculaLogado : undefined;

      this.ciService.updateLancamentoStatus(this.ci.id, this.respostaLancamento, dataLancamento, lancadorMatricula ?? undefined)
        .then(() => {
          if (this.ci) {
            this.ci.lancamentoStatus = this.respostaLancamento!;
            if (dataLancamento) {
              this.ci.dataLancamento = dataLancamento;
              this.dataLancamentoExibicao = new Date(dataLancamento).toLocaleDateString('pt-BR');
            }
            if (lancadorMatricula) {
              this.ci.lancador_matricula = lancadorMatricula;
              this.funcionarioService.getFuncionarioByMatricula(lancadorMatricula).subscribe(lancador => this.lancador = lancador);
            }
          }
        })
        .catch(err => {
          console.error('Erro ao salvar status de lançamento:', err);
          alert('Falha ao salvar o status de lançamento. Tente novamente.');
        });
    };

    const mensagem = `Tem certeza que deseja salvar o status como '${this.respostaLancamento === 'lancado' ? 'Lançado' : 'Pendente'}'?`;
    this.abrirModalConfirmacao(acao, mensagem);
  }
}
