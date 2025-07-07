import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../../../../services/funcionario.service';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ci-visualizar-aprovacao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ci-visualizar-aprovacao.component.html',
  styleUrls: ['./ci-visualizar-aprovacao.component.scss']
})
export class CiVisualizarAprovacaoComponent implements OnInit {
  imprimirComCopia = true;
  isDestinatario = false;
  respostaAprovacao: 'aprovado' | 'reprovado' | 'pendente' | null = null;
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
    const copiaParam = this.route.snapshot.queryParamMap.get('copia');

    if (copiaParam === 'false') {
      this.imprimirComCopia = false;
    } else {
      this.imprimirComCopia = true;
    }

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
            this.respostaAprovacao = this.ci.aprovacaoStatus;
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

            const remetente$ = this.funcionarioService.getFuncionarioByMatricula(String(ci.matricula));
            let destinatario$: Observable<Funcionario | null>;
            if (ci.destinatario_matricula) {
              destinatario$ = this.funcionarioService.getFuncionarioByMatricula(ci.destinatario_matricula);
            } else {
              const destinatarioTemp: Partial<Funcionario> = { funcionario: ci.para };
              destinatario$ = of(destinatarioTemp as Funcionario);
            }

            return forkJoin({
              remetente: remetente$,
              destinatario: destinatario$
            });
          }
          return of({ remetente: null, destinatario: null });
        })
      ).subscribe((data: { remetente: Funcionario | null, destinatario: Funcionario | null }) => {
        this.remetente = data.remetente;
        this.destinatario = data.destinatario;
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

  salvarAprovacao(): void {
    if (!this.ci || !this.respostaAprovacao) {
      return;
    }

    const dataAprovacao = this.respostaAprovacao === 'aprovado' ? new Date() : undefined;

    this.ciService.updateAprovacaoStatus(this.ci.id, this.respostaAprovacao, dataAprovacao)
      .then(() => {
        alert('Resposta salva com sucesso!');
        if (this.ci) {
          this.ci.aprovacaoStatus = this.respostaAprovacao!;
          if (dataAprovacao) {
            this.ci.dataAprovacao = dataAprovacao;
          }
        }
        this.voltarParaLista();
      })
      .catch((err: any) => {
        console.error('Erro ao salvar resposta:', err);
        alert('Falha ao salvar a resposta. Tente novamente.');
      });
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
        this.voltarParaLista();
      })
      .catch((err: any) => {
        console.error('Erro ao salvar status de lançamento:', err);
        alert('Falha ao salvar o status de lançamento. Tente novamente.');
      });
  }
}
