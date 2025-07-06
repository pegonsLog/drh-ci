import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { CiService, ComunicacaoInterna } from '../../../../services/ci.service';
import { FuncionarioService } from '../../../../services/funcionario.service';

@Component({
  selector: 'app-ci-listar-apuracao',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './ci-listar-apuracao.component.html',
  styleUrl: './ci-listar-apuracao.component.scss'
})
export class CiListarApuracaoComponent implements OnInit {
  matricula: string | null = null;
  cis$!: Observable<ComunicacaoInterna[]>;

  constructor(
    private ciService: CiService,
    private router: Router,
    private funcionarioService: FuncionarioService
  ) { }

  ngOnInit(): void {
    this.matricula = this.funcionarioService.getMatriculaLogada();
    this.cis$ = this.ciService.getCisParaApuracao().pipe(
      map(cis => cis.map(ci => {
        const data = ci.data as any;
        if (data && typeof data.toDate === 'function') {
          return { ...ci, data: data.toDate() };
        }
        const parsedDate = new Date(data);
        if (data && !isNaN(parsedDate.getTime())) {
          return { ...ci, data: parsedDate };
        }
        return ci;
      }))
    );
  }

  logout(): void {
    this.funcionarioService.logout();
    this.router.navigate(['/login']);
  }
}
