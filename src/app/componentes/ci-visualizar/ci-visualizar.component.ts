import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CiService, ComunicacaoInterna } from '../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../services/funcionario.service';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-ci-visualizar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ci-visualizar.component.html',
  styleUrls: ['./ci-visualizar.component.scss']
})
export class CiVisualizarComponent implements OnInit {
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
          setTimeout(() => this.gerarPdfEEnviar(true), 100);
        }
      });
    }
  }

  voltarParaLista(): void {
    if (this.matriculaLogado) {
      this.router.navigate(['/ci-listar', this.matriculaLogado]);
    }
  }

      gerarPdfEEnviar(navigateBack = false): void {
    const data = this.ciContainer.nativeElement;
    // Reduzido o 'scale' e alterado o formato da imagem para JPEG para diminuir o tamanho do arquivo
    html2canvas(data, { scale: 3, useCORS: true }).then(canvas => {
      const contentDataURL = canvas.toDataURL('image/jpeg', 0.9);
      // 'l' para landscape (paisagem)
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(contentDataURL, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const fileName = `CI de ${this.remetente?.funcionario || 'remetente'}.pdf`;
      pdf.save(fileName);

      // Abrir Gmail
      const subject = `CI de ${this.remetente?.funcionario || 'remetente'}`;
      const mailtoUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}`;
      window.open(mailtoUrl, '_blank');

      if (navigateBack) {
        this.voltarParaLista();
      }
    });
  }
}
