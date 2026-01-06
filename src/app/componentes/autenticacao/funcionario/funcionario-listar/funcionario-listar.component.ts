import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Funcionario, FuncionarioService } from '../../../../services/funcionario.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-funcionario-listar',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './funcionario-listar.component.html',
  styleUrls: ['./funcionario-listar.component.scss']
})
export class FuncionarioListarComponent implements OnInit {

  matricula: string | null = null;
  funcionarios: Funcionario[] = [];
  funcionariosFiltrados: Funcionario[] = [];
  perfilUsuario: string | null = null;
  filtro: string = '';
  isLoading: boolean = true;

  constructor(
    private funcionarioService: FuncionarioService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.funcionarioService.perfilUsuario$.subscribe((perfil: string | null) => {
      this.perfilUsuario = perfil;
    });
    
    this.carregarFuncionarios();
    this.matricula = this.route.snapshot.paramMap.get('matricula');
  }

  carregarFuncionarios(): void {
    this.isLoading = true;
    this.funcionarioService.getFuncionarios().subscribe({
      next: (funcionarios) => {
        this.funcionarios = funcionarios;
        this.funcionariosFiltrados = [...funcionarios];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar funcionários:', error);
        this.isLoading = false;
      }
    });
  }

  aplicarFiltro(): void {
    const filtroLower = this.filtro.toLowerCase().trim();
    
    if (!filtroLower) {
      this.funcionariosFiltrados = [...this.funcionarios];
      return;
    }

    this.funcionariosFiltrados = this.funcionarios.filter(f => {
      const matchNome = f.funcionario?.toLowerCase().includes(filtroLower);
      const matchMatricula = f.matricula?.toString().includes(filtroLower);
      const matchPerfil = f.perfil?.toLowerCase().includes(filtroLower);
      const matchEmail = f.email?.toLowerCase().includes(filtroLower);
      
      return matchNome || matchMatricula || matchPerfil || matchEmail;
    });
  }

  limparFiltro(): void {
    this.filtro = '';
    this.aplicarFiltro();
  }

  editarFuncionario(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/funcionario-alterar', this.matricula, id]);
    }
  }

  excluirFuncionario(id: string | undefined): void {
    if (id && confirm('Tem certeza que deseja excluir este funcionário?')) {
      this.funcionarioService.deleteFuncionario(id)
        .subscribe((success: any) => {
          if (success) {
            // Atualiza a lista após a exclusão
            this.carregarFuncionarios();
          } else {
            // Tratar erro
            alert('Erro ao excluir o funcionário.');
          }
        });
    }
  }
  
  navegarParaCiListarLancamento() {
    this.router.navigate(['/ci-listar-lancamento', this.matricula]);
  }
}
