import { Component, OnInit } from '@angular/core';

import { FuncionarioService } from '../../../../services/funcionario.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { CiService, ComunicacaoInterna } from '../../../../services/ci.service';
import { CiListarAprovacaoComponent } from "../ci-listar-aprovacao/ci-listar-aprovacao.component";
import { ConfirmacaoImpressaoModalComponent } from '../../../confirmacao-impressao-modal/confirmacao-impressao-modal.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ci-listar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, DatePipe, CiListarAprovacaoComponent, ConfirmacaoImpressaoModalComponent],
  templateUrl: './ci-listar.component.html',
  styleUrls: ['./ci-listar.component.scss']
})
export class CiListarComponent implements OnInit {
  mostrarModal = false;
  ciSelecionadaId: string | null = null;
  matricula: string | null = null;
  cis$!: Observable<ComunicacaoInterna[]>;
  perfilUsuario$: Observable<string | null>;

  constructor(
    private ciService: CiService, 
    private router: Router,
    private route: ActivatedRoute,
    private funcionarioService: FuncionarioService
  ) { 
    this.perfilUsuario$ = this.funcionarioService.perfilUsuario$;
  }

  abrirModalImpressao(ciId: string): void {
    this.ciSelecionadaId = ciId;
    this.mostrarModal = true;
  }

  processarEscolhaDeImpressao(comCopia: boolean): void {
    if (this.ciSelecionadaId && this.matricula) {
      this.router.navigate(['/ci-visualizar', this.matricula, this.ciSelecionadaId], { 
        queryParams: { copia: comCopia.toString() } 
      });
    }
    this.mostrarModal = false;
    this.ciSelecionadaId = null;
  }

  enviarEmailNotificacao(ci: ComunicacaoInterna): void {
    const subject = `CI de ${ci.de} para Aprovação`;
    const body = `Olá, ${ci.para}.\n\nVocê recebeu uma nova CI para sua análise.\n\nAcesse o sistema em: https://drh-ci.web.app\n\nAtenciosamente.`;

    let matriculaRemetente = ci.matricula;
    let matriculaDestinatario = ci.destinatario_matricula;
    if (!matriculaDestinatario && ci.para) {
      matriculaDestinatario = ci.para;
    }
    if (!matriculaRemetente || !matriculaDestinatario) {
      alert('Não foi possível identificar os envolvidos para envio de email automático.');
      return;
    }

    // Abra a aba imediatamente para evitar bloqueio de pop-up
    const popup = window.open('', '_blank');
    if (!popup) {
      alert('Não foi possível abrir a janela do Gmail. Verifique se o navegador está bloqueando pop-ups.');
      return;
    }

    this.funcionarioService.getFuncionarioByMatricula(matriculaRemetente).subscribe(remetente => {
      this.funcionarioService.getFuncionarioByMatricula(matriculaDestinatario!).subscribe(destinatario => {
        if (!remetente || !remetente.email || !destinatario || !destinatario.email) {
          popup.close();
          alert('Não foi possível obter os emails dos envolvidos.');
          return;
        }
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(destinatario.email)}&cc=${encodeURIComponent(remetente.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        popup.location.href = gmailUrl;
      });
    });
  }

  ngOnInit(): void {
    this.matricula = this.route.snapshot.paramMap.get('matricula');
    if (this.matricula) {
      this.cis$ = this.ciService.getCisPorUsuario(this.matricula).pipe(
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
      this.router.navigate(['/ci-alterar', this.matricula, id]);
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


  excluirCi(id: string | undefined): void {
    if (id && confirm('Tem certeza que deseja excluir esta comunicação?')) {
      this.ciService.deleteCi(id)
        .then(() => {})
        .catch(err => {
        // Idealmente, mostrar um erro para o usuário aqui
      });
    }
  }
}
