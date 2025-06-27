import { Component, OnInit } from '@angular/core';
import { FuncionarioService } from '../../services/funcionario.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
    private funcionarioService: FuncionarioService
  ) { }

  ngOnInit(): void {
    this.cis$ = this.ciService.getCis().pipe(
      map(cis => cis.map(ci => {
        // Convert Firestore Timestamp to JavaScript Date for the DatePipe
        const dataAsDate = (ci.data as any).toDate();
        return { ...ci, data: dataAsDate };
      }))
    );
    this.matricula = this.funcionarioService.getMatriculaLogada();
  }

  editarCi(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/ci-alterar', id]);
    }
  }

  excluirCi(id: string | undefined): void {
    if (id && confirm('Tem certeza que deseja excluir esta comunicação?')) {
      this.ciService.deleteCi(id)
        .then(() => console.log('CI excluída com sucesso!'))
        .catch(err => console.error('Erro ao excluir CI:', err));
    }
  }
}
