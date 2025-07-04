import { Component, OnInit, ElementRef, Renderer2, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CiService, ComunicacaoInterna } from '../../../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../../../services/funcionario.service';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleDriveService } from '../../../../services/google-drive.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { LayoutModule } from '@angular/cdk/layout';
import { ConfirmacaoImpressaoModalComponent } from '../../../confirmacao-impressao-modal/confirmacao-impressao-modal.component';

@Component({
  selector: 'app-ci-visualizar',
  standalone: true,
  imports: [CommonModule, LayoutModule, ConfirmacaoImpressaoModalComponent, FormsModule, TitleCasePipe],
  templateUrl: './ci-visualizar.component.html',
  styleUrls: ['./ci-visualizar.component.scss']
})
export class CiVisualizarComponent implements OnInit {
  isDestinatario = false;
  respostaAprovacao: 'aprovado' | 'reprovado' | null = null;
  isDesktop = false;
  mostrarModal = false;
  imprimirComCopia = true; // Controla a visibilidade da cópia na tela
  @ViewChild('ciContainer') ciContainer!: ElementRef;
  ci: ComunicacaoInterna | null = null;
  remetente: Funcionario | null = null;
  destinatario: Funcionario | null = null;
  matriculaLogado: string | null = null;
  dataExibicao: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ciService: CiService,
    private funcionarioService: FuncionarioService,
    private renderer: Renderer2,
    private el: ElementRef,
    private googleDriveService: GoogleDriveService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.breakpointObserver.observe([
      Breakpoints.WebLandscape,
      Breakpoints.WebPortrait
    ]).subscribe(result => {
      this.isDesktop = result.matches;
    });
  }

  ngOnInit(): void {
    this.matriculaLogado = this.funcionarioService.getMatriculaLogada();
    const ciId = this.route.snapshot.paramMap.get('id');
    const acao = this.route.snapshot.queryParamMap.get('acao');
    const origem = this.route.snapshot.queryParamMap.get('origem');
    const isHeadless = acao === 'gerarPDF' && origem === 'mobile';

    if (isHeadless) {
      this.renderer.addClass(this.el.nativeElement, 'headless-mode');
    }

    if (ciId) {
      this.ciService.getCi(ciId).pipe(
        switchMap((ci: ComunicacaoInterna) => {
          if (ci) {
            this.ci = ci;
            // Define o status padrão para CIs antigas que não têm o campo
            if (!this.ci.aprovacaoStatus) {
              this.ci.aprovacaoStatus = 'pendente';
            }
            this.isDestinatario = this.matriculaLogado === this.ci.destinatario_matricula;

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

        if (isHeadless) {
          // Em modo headless (mobile), pula o modal e gera o PDF diretamente.
          setTimeout(() => this.processarEscolhaDeImpressao(true), 100);
        } else if (acao === 'gerarPDF') {
          // Em modo normal (desktop), mostra o modal.
          setTimeout(() => this.solicitarImpressao(), 100);
        }
      });
    }
  }

  voltarParaLista(): void {
    if (this.matriculaLogado) {
      this.router.navigate(['/ci-listar', this.matriculaLogado]);
    }
  }

  solicitarImpressao(): void {
    this.mostrarModal = true;
  }

  fecharModal(): void {
    this.mostrarModal = false;
  }

  processarEscolhaDeImpressao(comCopia: boolean): void {
    this.imprimirComCopia = comCopia;
    this.mostrarModal = false;

    // Atraso para o *ngIf remover a cópia do DOM antes de gerar o PDF
    setTimeout(() => {
      this.executarGeracaoPdfEEnviar();
    }, 100);
  }

  imprimirPagina(): void {
    window.print();
  }

  salvarAprovacao(): void {
    if (!this.ci || !this.respostaAprovacao) {
      return;
    }
    this.ciService.updateAprovacaoStatus(this.ci.id, this.respostaAprovacao)
      .then(() => {
        if (this.ci && this.respostaAprovacao) { // Garante que respostaAprovacao não seja nulo
          this.ci.aprovacaoStatus = this.respostaAprovacao;
        }
        alert('Resposta salva com sucesso!');
      })
      .catch((err: any) => {
        console.error('Erro ao salvar resposta:', err);
        alert('Falha ao salvar a resposta. Tente novamente.');
      });
  }

  private executarGeracaoPdfEEnviar(): void {
    const data = this.ciContainer.nativeElement;

    // Adiciona uma classe ao host para forçar o layout de desktop durante a captura
    if (this.isDesktop) {
      this.renderer.addClass(this.el.nativeElement, 'pdf-generation-mode');
    }

    // Pequeno atraso para garantir que o navegador aplique os estilos antes da captura
    setTimeout(() => {
      html2canvas(data, { scale: 3, useCORS: true }).then(canvas => {
        // Remove a classe imediatamente após a captura para restaurar o layout responsivo
        if (this.isDesktop) {
          this.renderer.removeClass(this.el.nativeElement, 'pdf-generation-mode');
        }

        const contentDataURL = canvas.toDataURL('image/jpeg', 0.7);
        const pdf = new jsPDF('l', 'mm', 'a4');
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        pdf.addImage(contentDataURL, 'PNG', 0, 0, width, height);

        // --- Lógica para o nome do arquivo ---
        const nomeParts = this.remetente?.funcionario.split(' ') ?? [];
        const nomeRemetente = nomeParts.length > 1
          ? `${nomeParts[0]} ${nomeParts[nomeParts.length - 1]}`
          : (this.remetente?.funcionario || 'Remetente');
        const data = new Date();
        const dataFormatada = `${data.getDate().toString().padStart(2, '0')}-${(data.getMonth() + 1).toString().padStart(2, '0')}-${data.getFullYear()}`;
        const nomeArquivo = `CI de solicitação de folga-${nomeRemetente}-${dataFormatada}.pdf`;

                // Converte o PDF para Blob para o upload
        const pdfBlob = pdf.output('blob');

        // Mostra uma notificação para o usuário
        alert('Salvando PDF no Google Drive... Por favor, aguarde e não feche a janela.');

        // Faz o upload para o Google Drive
        this.googleDriveService.uploadPdf(pdfBlob, nomeArquivo).subscribe({
          next: (driveResponse: any) => {
            alert('PDF salvo com sucesso no Google Drive!');
            
            const fileLink = driveResponse.webViewLink; // Captura o link do arquivo

            // Abre o cliente de e-mail padrão com os campos preenchidos
            const subject = `CI de solicitação de folga de ${this.remetente?.funcionario || 'remetente'} - ${dataFormatada}`;
            const body = `Prezado(a),\n\nA CI de solicitação de folga foi gerada e salva no Google Drive.\n\nVocê pode acessá-la diretamente pelo link abaixo:\n${fileLink}\n\nAtenciosamente.`;
            const recipientEmail = 'consultafolgadrh@gmail.com';

          // Verifica se o sistema operacional é macOS para decidir a ação de e-mail
          const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

          if (isMac) {
            // No macOS, abre o Gmail em uma nova aba para uma melhor experiência web
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmail}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(gmailUrl, '_blank');
          } else {
            // Para outros sistemas, usa o 'mailto:' padrão que abre o cliente de e-mail local
            const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoUrl;
          }
          },
          error: (err) => {
            console.error('Falha ao salvar no Google Drive:', err);
            alert('Não foi possível salvar o PDF no Google Drive. O e-mail não será aberto.');
          }
        });

        // Se estiver em modo headless, volta para a lista após a conclusão.
        if (this.el.nativeElement.classList.contains('headless-mode')) {
          this.voltarParaLista();
        }
      });
    }, 500);
  }
}
