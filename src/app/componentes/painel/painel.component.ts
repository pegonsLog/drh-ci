import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FuncionarioService } from '../../services/funcionario.service';
import { TreComponent } from "../consulta/tre/tre.component";
import { DrhComponent } from "../consulta/drh/drh.component";
import { PfComponent } from "../consulta/pf/pf.component";

@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DrhComponent,
    PfComponent,
    TreComponent
  ],
  templateUrl: './painel.component.html',
  styleUrls: ['./painel.component.scss']
})
export class PainelComponent implements OnInit {

  matricula: string | null = null;
  funcionarioNome: string = '';
  perfilUsuario: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionarioService: FuncionarioService
  ) { }

  ngOnInit(): void {
    this.matricula = this.route.snapshot.paramMap.get('matricula');
    if (this.matricula) {
      this.funcionarioService.getFuncionarioByMatricula(this.matricula).subscribe(funcionario => {
        if (funcionario) {
          this.funcionarioNome = funcionario.funcionario;
          this.perfilUsuario = funcionario.perfil;
          this.funcionarioService.setPerfil(this.perfilUsuario);
        }
      });
    }
  }

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }

  navegarParaCiListar(): void {
    this.router.navigate(['/ci-listar', this.matricula]);
  }

  navegarParaFuncionarioListar(): void {
    this.router.navigate(['/funcionario-listar', this.matricula]);
  }

  navegarParaEscalaListar(): void {
    this.router.navigate(['/escala-listar']);
  }

  navegarParaCiListarLancamento() {
    this.router.navigate(['/ci-listar-lancamento', this.matricula]);
    }
}
