import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../../../../services/funcionario.service';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ci-visualizar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ci-visualizar.component.html',
  styleUrls: ['./ci-visualizar.component.scss']
})
export class CiVisualizarComponent implements OnInit {
  imprimirComCopia = true;

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
            // Define o status padrão para CIs antigas que não têm o campo
            if (!this.ci.aprovacaoStatus) {
              this.ci.aprovacaoStatus = 'pendente';
            }
            if (!this.ci.aprovacao_gerente) {
              this.ci.aprovacao_gerente = 'pendente';
            }


            // Lógica para formatar a data
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

            // Lógica para formatar a data de aprovação
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

            // Lógica para formatar a data de lançamento
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

            // Lógica para formatar a data de aprovação do gerente
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
    if (this.matriculaLogado) {
      this.router.navigate(['/ci-listar', this.matriculaLogado]);
    }
  }

  sair(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }

  imprimirPagina(): void {
    window.print();
  }

}
