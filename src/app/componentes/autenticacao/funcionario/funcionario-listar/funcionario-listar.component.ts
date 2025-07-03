import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Funcionario, FuncionarioService } from '../../../../services/funcionario.service';

@Component({
  selector: 'app-funcionario-listar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './funcionario-listar.component.html',
  styleUrls: ['./funcionario-listar.component.scss']
})
export class FuncionarioListarComponent implements OnInit {
  matricula: string | null = null;
  funcionarios$!: Observable<Funcionario[]>;
  perfilUsuario: string | null = null;

  constructor(
    private funcionarioService: FuncionarioService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
        this.funcionarioService.perfilUsuario$.subscribe((perfil: string | null) => {
      this.perfilUsuario = perfil;
    });
    this.funcionarios$ = this.funcionarioService.getFuncionarios();
    this.matricula = this.route.snapshot.paramMap.get('matricula');
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
            this.funcionarios$ = this.funcionarioService.getFuncionarios();
          } else {
            // Tratar erro
            alert('Erro ao excluir o funcionário.');
          }
        });
    }
  }
}
