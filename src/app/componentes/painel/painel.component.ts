import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FuncionarioService } from '../../services/funcionario.service';
import { TreComponent } from "../tre/tre.component";
import { DrhComponent } from "../drh/drh.component";
import { PfComponent } from "../pf/pf.component";

@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionarioService: FuncionarioService
  ) { }

  ngOnInit(): void {
    this.matricula = this.route.snapshot.paramMap.get('matricula');
  }

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }
}
