import { Component, OnInit } from '@angular/core';
import { FuncionarioService } from '../../services/funcionario.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { CiService, ComunicacaoInterna } from '../../services/ci.service';

@Component({
  selector: 'app-ci-listar',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './ci-listar.component.html',
  styleUrls: ['./ci-listar.component.scss']
})
export class CiListarComponent implements OnInit {
  matricula: string | null = null;
  cis$!: Observable<ComunicacaoInterna[]>;

  constructor(
    private ciService: CiService, 
    private router: Router,
    private route: ActivatedRoute,
    private funcionarioService: FuncionarioService
  ) { }

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
