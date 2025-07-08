import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Escala, EscalaService } from '../../../../services/escala.service';
import { Router } from '@angular/router';
import { FuncionarioService } from '../../../../services/funcionario.service';

@Component({
  selector: 'app-escala-listar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './escala-listar.component.html',
  styleUrl: './escala-listar.component.scss'
})
export class EscalaListarComponent implements OnInit {

  escalas$!: Observable<Escala[]>;

  // Para o modal de exclusão
  mostrarModalExcluir = false;
  escalaParaExcluir: string | null = null;

  matriculaUsuario: string | null = null;
  isAdm: boolean = false;

  constructor(
    private escalaService: EscalaService,
    private router: Router,
    private funcionarioService: FuncionarioService
  ) {}


  ngOnInit(): void {
    this.matriculaUsuario = this.funcionarioService.getMatriculaLogada?.() || sessionStorage.getItem('matricula');
    const perfil = sessionStorage.getItem('perfil');
    this.isAdm = perfil === 'adm';
    this.escalas$ = this.escalaService.getEscalas().pipe(
      // Ordena os cards na ordem desejada
      map(escalas => {
        const ordem = ['manhã', 'tarde', 'administrativo', 'gestores'];
        return escalas.slice().sort((a, b) => {
          const idxA = ordem.indexOf(a.turno.toLowerCase());
          const idxB = ordem.indexOf(b.turno.toLowerCase());
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
      })
    );
  }

  abrirLink(link: string): void {
    window.open(link, '_blank');
  }

  abrirNovaEscala(): void {
    this.router.navigate(['/escala-nova']);
  }

  editarEscala(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/escala-alterar', id]);
    }
  }

  confirmarExclusao(id: string | undefined): void {
    if (id) {
      this.escalaParaExcluir = id;
      this.mostrarModalExcluir = true;
    }
  }

  cancelarExclusao(): void {
    this.mostrarModalExcluir = false;
    this.escalaParaExcluir = null;
  }

  voltarPainel(): void {
    if (this.matriculaUsuario) {
      this.router.navigate(['/painel', this.matriculaUsuario]);
    }
  }

  excluirEscalaConfirmada(): void {
    if (this.escalaParaExcluir) {
      this.escalaService.updateEscala(this.escalaParaExcluir, { deletado: true })
        .then(() => {
          this.escalas$ = this.escalaService.getEscalas();
          this.mostrarModalExcluir = false;
          this.escalaParaExcluir = null;
        })
        .catch(() => {
          alert('Erro ao excluir a escala.');
          this.mostrarModalExcluir = false;
          this.escalaParaExcluir = null;
        });
    }
  }

  abrirCiListarLancamento() {
    this.router.navigate(['/ci-listar-lancamento', this.matriculaUsuario]);
    }
}
