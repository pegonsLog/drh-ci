import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { DocumentData, DocumentSnapshot } from 'firebase/firestore';

import { FuncionarioService } from '../../../../../services/funcionario.service';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { StatusFormatPipe } from '../../../../../pipes/status-format.pipe';
import { ConfirmacaoImpressaoModalComponent } from '../../../../confirmacao-impressao-modal/confirmacao-impressao-modal.component';
import { ConfirmacaoExclusaoModalComponent } from '../../../../confirmacao-exclusao-modal/confirmacao-exclusao-modal.component';

@Component({
  selector: 'app-ci-listar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, DatePipe, FormsModule, StatusFormatPipe, ConfirmacaoImpressaoModalComponent, ConfirmacaoExclusaoModalComponent],
  templateUrl: './ci-listar.component.html',
  styleUrls: ['./ci-listar.component.scss']
})
export class CiListarComponent implements OnInit {
  mostrarModal = false;
  mostrarModalExclusao = false;
  ciSelecionadaId: string | null = null;
  ciParaExcluirId: string | null = null;
  matricula: string | null = null;
  perfilUsuario$: Observable<string | null>;

  // Pagination properties
  cis: ComunicacaoInterna[] = [];
  isLoading = true;
  pageNumber = 1;
  pageSize = 10;
  isLastPage = false;

  private firstDocOnPage: DocumentSnapshot<DocumentData> | null = null;
  private lastDocOnPage: DocumentSnapshot<DocumentData> | null = null;

  constructor(
    @Inject(CiService) private ciService: CiService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(FuncionarioService) private funcionarioService: FuncionarioService
  ) {
    this.perfilUsuario$ = this.funcionarioService.perfilUsuario$;
  }

  ngOnInit(): void {
    this.matricula = this.route.snapshot.paramMap.get('matricula');
    if (this.matricula) {
      this.loadCis('next'); // Load initial page
    } else {
      this.isLoading = false;
    }
  }

  loadCis(direction: 'next' | 'prev', cursor?: DocumentSnapshot<DocumentData>): void {
    if (!this.matricula) return;
    this.isLoading = true;

    this.ciService.getCisPorUsuarioPaginado(this.matricula, this.pageSize, direction, cursor).subscribe(result => {
      if (result.cis.length === 0) {
        if (direction === 'next') this.isLastPage = true;
        this.isLoading = false;
        return;
      }

      this.cis = result.cis.map(ci => {
        const data = ci.data as any;
        if (data && typeof data.toDate === 'function') {
          return { ...ci, data: data.toDate() };
        }
        const parsedDate = new Date(data);
        if (data && !isNaN(parsedDate.getTime())) {
          return { ...ci, data: parsedDate };
        }
        return { ...ci, data: data as any };
      });

      this.firstDocOnPage = result.firstDoc;
      this.lastDocOnPage = result.lastDoc;
      this.isLastPage = result.cis.length < this.pageSize;
      this.isLoading = false;
    });
  }

  nextPage(): void {
    if (!this.isLastPage) {
      this.pageNumber++;
      this.loadCis('next', this.lastDocOnPage ?? undefined);
    }
  }

  previousPage(): void {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.isLastPage = false;
      this.loadCis('prev', this.firstDocOnPage ?? undefined);
    }
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


  abrirModalExclusao(ciId: string): void {
    this.ciParaExcluirId = ciId;
    this.mostrarModalExclusao = true;
  }

  processarDecisaoExclusao(decisao: boolean): void {
    this.mostrarModalExclusao = false;
    if (decisao && this.ciParaExcluirId) {
      const idParaExcluir = this.ciParaExcluirId;
      this.ciService.deleteCi(idParaExcluir)
        .then(() => {
          // Remove a CI da lista local para atualizar a UI instantaneamente.
          this.cis = this.cis.filter(ci => ci.id !== idParaExcluir);

          // Se a página atual ficar vazia e não for a primeira página, volte para a anterior.
          if (this.cis.length === 0 && this.pageNumber > 1) {
            this.previousPage();
          } else if (this.cis.length === 0 && this.pageNumber === 1) {
            // Se a primeira página ficar vazia, recarregue para mostrar o estado vazio.
            this.isLastPage = true;
          }
        })
        .catch(err => {
          console.error("Erro ao excluir a CI:", err);
          // Idealmente, mostrar uma mensagem de erro para o usuário aqui.
        });
    }
    this.ciParaExcluirId = null;
  }

  excluirCi(id: string | undefined): void {
    if (id) {
      this.abrirModalExclusao(id);
    }
  }

  copiarConteudo(texto: string) {
    if (texto) {
      navigator.clipboard.writeText(texto).then(() => {
        this.snackBar.open('Comunicação copiada para a área de transferência!', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }).catch(err => {
        console.error('Erro ao copiar texto: ', err);
        this.snackBar.open('Erro ao copiar comunicação.', 'Fechar', {
          duration: 3000,
        });
      });
    }
  }
}
