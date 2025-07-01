import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CiService, ComunicacaoInterna } from '../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../services/funcionario.service';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ConfirmacaoImpressaoModalComponent } from '../confirmacao-impressao-modal/confirmacao-impressao-modal.component';

@Component({
  selector: 'app-ci-visualizar',
  standalone: true,
  imports: [CommonModule, ConfirmacaoImpressaoModalComponent],
  templateUrl: './ci-visualizar.component.html',
  styleUrls: ['./ci-visualizar.component.scss']
})
export class CiVisualizarComponent implements OnInit {
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
    private funcionarioService: FuncionarioService
  ) { }

    ngOnInit(): void {
    this.matriculaLogado = this.funcionarioService.getMatriculaLogada();
    const ciId = this.route.snapshot.paramMap.get('id');
    const gerarPdf = this.route.snapshot.queryParamMap.get('gerar') === 'true';

    if (ciId) {
      this.ciService.getCi(ciId).pipe(
        switchMap((ci: ComunicacaoInterna) => {
          if (ci) {
            this.ci = ci;

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

            const remetente$ = this.funcionarioService.getFuncionarioByMatricula(ci.matricula);
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

        if (gerarPdf) {
          // Timeout para garantir que o DOM seja atualizado com os dados antes de gerar o PDF
          setTimeout(() => this.processarEscolhaDeImpressao(true), 100);
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

  private executarGeracaoPdfEEnviar(): void {
    const data = this.ciContainer.nativeElement;

    html2canvas(data, { scale: 3, useCORS: true }).then(canvas => {
      const contentDataURL = canvas.toDataURL('image/jpeg', 0.7);
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(contentDataURL, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`CI_${this.ci?.id}.pdf`);

      // Abrir Gmail
      const subject = `CI de ${this.remetente?.funcionario || 'remetente'}`;
      const body = `Prezados, segue em anexo a CI.`;
      const mailtoUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl, '_blank');
    });
  }
}
