import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CiService, ComunicacaoInterna } from '../../../../services/ci.service';
import { FuncionarioService } from '../../../../services/funcionario.service';
import { switchMap, take, filter } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-ci-alterar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './ci-alterar.component.html',
  styleUrls: ['./ci-alterar.component.scss']
})
export class CiAlterarComponent implements OnInit {
  ciForm: FormGroup;
  ciId: string | null = null;
  matricula: string | null = null;
  private originalCi: ComunicacaoInterna | null = null;

  constructor(
    private fb: FormBuilder,
    private ciService: CiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.ciForm = this.fb.group({
      de: [{value: '', disabled: true}, Validators.required],
      para: ['', Validators.required],
      comunicacao: ['', Validators.required],
      aprovacaoStatus: ['pendente', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      take(1),
      switchMap(params => {
        this.ciId = params.get('id');
        this.matricula = params.get('matricula');
        if (this.ciId) {
          return this.ciService.getCi(this.ciId);
        }
        if (this.matricula) {
          this.router.navigate(['/ci-listar', this.matricula]);
        } else {
          this.router.navigate(['/ci-listar']);
        }
        return of(null);
      }),
      filter((ci): ci is ComunicacaoInterna => ci !== null) // Garante que o valor não é nulo
    ).subscribe(ci => {
      this.originalCi = ci; // Armazena a CI original
      this.ciForm.patchValue(ci);
    });
  }

  onSubmit(): void {
    if (this.ciForm.valid && this.ciId && this.originalCi) {
      const formValue = this.ciForm.getRawValue(); // Usa getRawValue para incluir campos desabilitados
      const ciAtualizada: ComunicacaoInterna = {
        ...this.originalCi, // Mantém dados originais como data e matrícula
        ...formValue, // Sobrescreve com os valores do formulário
        id: this.ciId,
      };

      this.ciService.updateCi(ciAtualizada)
        .then(() => {
          
          if (this.matricula) {
            this.router.navigate(['/ci-listar', this.matricula]);
          } else {
            this.router.navigate(['/ci-listar']);
          }
        })
        .catch(err => {
          // Idealmente, mostrar um erro para o usuário aqui
        });
    }
  }
}
