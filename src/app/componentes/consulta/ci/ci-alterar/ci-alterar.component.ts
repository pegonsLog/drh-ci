import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CiService, ComunicacaoInterna } from '../../../../services/ci.service';
import { Funcionario, FuncionarioService } from '../../../../services/funcionario.service';
import { switchMap, take, filter } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

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
  funcionarios$: Observable<Funcionario[]>;

  constructor(
    private fb: FormBuilder,
    private ciService: CiService,
    private router: Router,
    private route: ActivatedRoute,
    private funcionarioService: FuncionarioService
  ) {
    this.ciForm = this.fb.group({
      de: [{ value: '', disabled: true }, Validators.required],
      para: ['', Validators.required], // Este controle agora armazenará a matrícula do destinatário
      comunicacao: ['', Validators.required]
    });
    this.funcionarios$ = this.funcionarioService.getFuncionarios();
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
        return of(null);
      }),
      filter((ci): ci is ComunicacaoInterna => ci !== null)
    ).subscribe(ci => {
      this.originalCi = ci;
      this.ciForm.patchValue({
        de: ci.de,
        para: ci.destinatario_matricula, // Povoa o form com a matrícula do destinatário
        comunicacao: ci.comunicacao
      });
    });
  }

  onSubmit(): void {
    if (this.ciForm.valid && this.ciId && this.originalCi) {
      const formValue = this.ciForm.getRawValue();

      this.funcionarios$.pipe(take(1)).subscribe(funcionarios => {
        const destinatarioMatricula = formValue.para;
        const destinatario = funcionarios.find(f => f.matricula === destinatarioMatricula);

        if (!destinatario) {
          console.error('Destinatário não encontrado');
          // Adicionar feedback para o usuário aqui
          return;
        }

        const ciAtualizada: Partial<ComunicacaoInterna> = {
          ...this.originalCi,
          comunicacao: formValue.comunicacao,
          para: destinatario.funcionario, // Nome do funcionário
          destinatario_matricula: destinatario.matricula, // Matrícula do funcionário
        };

        delete ciAtualizada.aprovacaoStatus; // Remove o status de aprovação

        this.ciService.updateCi(ciAtualizada as ComunicacaoInterna)
          .then(() => {
            if (this.matricula) {
              this.router.navigate(['/ci-listar', this.matricula]);
            } else {
              this.router.navigate(['/ci-listar']);
            }
          })
          .catch(err => {
            console.error('Erro ao atualizar CI:', err);
          });
      });
    }
  }
}
