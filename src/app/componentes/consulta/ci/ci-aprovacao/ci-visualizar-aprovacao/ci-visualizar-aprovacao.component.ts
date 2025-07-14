import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../../../../services/funcionario.service';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmacaoAcaoModalComponent } from '../../../../confirmacao-acao-modal/confirmacao-acao-modal.component';
import { SafeHtmlPipe } from '../../../../../pipes/safe-html.pipe';

@Component({
  selector: 'app-ci-visualizar-aprovacao',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmacaoAcaoModalComponent, SafeHtmlPipe],
  templateUrl: './ci-visualizar-aprovacao.component.html',
  styleUrls: ['./ci-visualizar-aprovacao.component.scss']
})
export class CiVisualizarAprovacaoComponent implements OnInit {

  isDestinatario = false;
  respostaAprovacao: 'aprovado' | 'nao_aprovado' | 'pendente' | null = null;
  respostaLancamento: 'lancado' | 'pendente' | null = null;
  respostaAprovacaoGerente: 'aprovado' | 'nao_aprovado' | 'pendente' | null = null;
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
  perfil: string | null = null;

  // Controle do Modal de Confirmação de Ação
  mostrarModalAcao = false;
  mensagemModalAcao = '';
  private acaoPendente: (() => void) | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(CiService) private ciService: CiService,
    @Inject(FuncionarioService) private funcionarioService: FuncionarioService
  ) {}


  ngOnInit(): void {
    this.perfil = sessionStorage.getItem('perfil');

    this.matriculaLogado = this.funcionarioService.getMatriculaLogada();
    const ciId = this.route.snapshot.paramMap.get('id');

    if (ciId) {
      this.ciService.getCi(ciId).pipe(
        switchMap((ci: ComunicacaoInterna) => {
          if (ci) {
            this.ci = ci;
            if (!this.ci.aprovacaoStatus) {
              this.ci.aprovacaoStatus = 'pendente';
            }
            if (!this.ci.aprovacao_gerente) {
              this.ci.aprovacao_gerente = 'pendente';
            }
            this.respostaAprovacao = this.ci.aprovacaoStatus;
            this.respostaAprovacaoGerente = this.ci.aprovacao_gerente || 'pendente';
            this.isDestinatario = this.matriculaLogado === this.ci.destinatario_matricula;

            

            if (ci.data) {
              if (typeof (ci.data as any).toDate === 'function') {
                this.dataExibicao = (ci.data as any).toDate().toLocaleDateString('pt-BR');
              } else if (typeof ci.data === 'string') {
                this.dataExibicao = ci.data;
              } else {
                try {
                  this.dataExibicao = new Date(ci.data).toLocaleDateString('pt-BR');
                } catch (e) {
                  this.dataExibicao = 'Data inválida';
                }
              }
            }

            if (ci.dataAprovacao) {
              if (typeof (ci.dataAprovacao as any).toDate === 'function') {
                this.dataAprovacaoExibicao = (ci.dataAprovacao as any).toDate().toLocaleDateString('pt-BR');
              } else {
                try {
                  this.dataAprovacaoExibicao = new Date(ci.dataAprovacao).toLocaleDateString('pt-BR');
                } catch (e) {
                  this.dataAprovacaoExibicao = 'Data inválida';
                }
              }
            }

            if (ci.dataLancamento) {
              if (typeof (ci.dataLancamento as any).toDate === 'function') {
                this.dataLancamentoExibicao = (ci.dataLancamento as any).toDate().toLocaleDateString('pt-BR');
              } else {
                try {
                  this.dataLancamentoExibicao = new Date(ci.dataLancamento).toLocaleDateString('pt-BR');
                } catch (e) {
                  this.dataLancamentoExibicao = 'Data inválida';
                }
              }
            }

            if (ci.data_aprovacao_gerente) {
              if (typeof (ci.data_aprovacao_gerente as any).toDate === 'function') {
                this.dataAprovacaoGerenteExibicao = (ci.data_aprovacao_gerente as any).toDate().toLocaleDateString('pt-BR');
              } else {
                try {
                  this.dataAprovacaoGerenteExibicao = new Date(ci.data_aprovacao_gerente).toLocaleDateString('pt-BR');
                } catch (e) {
                  this.dataAprovacaoGerenteExibicao = 'Data inválida';
                }
              }
            }

            const remetente$ = this.funcionarioService.getFuncionarioByMatricula(String(ci.matricula));
            let destinatario$: Observable<Funcionario | null>;
            if (ci.destinatario_matricula) {
              destinatario$ = this.funcionarioService.getFuncionarioByMatricula(ci.destinatario_matricula);
            } else {
              const destinatarioTemp: Partial<Funcionario> = { funcionario: ci.para };
              destinatario$ = of(destinatarioTemp as Funcionario);
            }

            let lancador$: Observable<Funcionario | null>;
            if (ci.lancador_matricula) {
              lancador$ = this.funcionarioService.getFuncionarioByMatricula(ci.lancador_matricula);
            } else {
              lancador$ = of(null);
            }

            let gerenteAprovador$: Observable<Funcionario | null>;
            if (ci.gerente_aprovador_matricula) {
              gerenteAprovador$ = this.funcionarioService.getFuncionarioByMatricula(ci.gerente_aprovador_matricula);
            } else {
              gerenteAprovador$ = of(null);
            }

            return forkJoin({
              remetente: remetente$,
              destinatario: destinatario$,
              lancador: lancador$,
              gerenteAprovador: gerenteAprovador$
            });
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

  voltarParaLista(): void {
    this.router.navigate(['/ci-listar-aprovacao', this.matriculaLogado]);
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

  salvarAprovacao(): void {
    const acao = () => {
      if (!this.ci || !this.respostaAprovacao) return;
      const dataAprovacao = this.respostaAprovacao === 'aprovado' ? new Date() : undefined;
      this.ciService.updateAprovacaoStatus(this.ci.id, this.respostaAprovacao, dataAprovacao)
        .then(() => {
          if (this.ci) {
            this.ci.aprovacaoStatus = this.respostaAprovacao!;
            if (dataAprovacao) this.ci.dataAprovacao = dataAprovacao;
          }
          this.voltarParaLista();
        })
        .catch(err => console.error('Erro ao salvar resposta:', err));
    };
    this.abrirModalConfirmacao(acao, `Tem certeza que deseja ${this.respostaAprovacao === 'aprovado' ? 'aprovar' : 'reprovar'} esta CI?`);
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
          this.voltarParaLista();
        })
        .catch(err => console.error('Erro ao salvar status de lançamento:', err));
    };
    this.abrirModalConfirmacao(acao, `Tem certeza que deseja confirmar o ${this.respostaLancamento}?`);
  }

  salvarAprovacaoGerente(): void {
    const acao = () => {
      if (!this.ci || !this.respostaAprovacaoGerente) return;
      const dataAprovacaoGerente = this.respostaAprovacaoGerente === 'aprovado' ? new Date() : undefined;
      const gerenteMatricula = this.respostaAprovacaoGerente === 'aprovado' ? this.matriculaLogado : undefined;
      this.ciService.updateAprovacaoGerenteStatus(this.ci.id, this.respostaAprovacaoGerente, dataAprovacaoGerente, gerenteMatricula ?? undefined)
        .then(() => {
          if (this.ci) {
            this.ci.aprovacao_gerente = this.respostaAprovacaoGerente!;
            if (dataAprovacaoGerente) {
              this.ci.data_aprovacao_gerente = dataAprovacaoGerente;
              this.dataAprovacaoGerenteExibicao = new Date(dataAprovacaoGerente).toLocaleDateString('pt-BR');
            }
          }
          this.voltarParaLista();
        })
        .catch(err => console.error('Erro ao salvar resposta do gerente:', err));
    };
    this.abrirModalConfirmacao(acao, `Tem certeza que deseja registrar o 'De acordo' do Gerente?`);
  }
}
