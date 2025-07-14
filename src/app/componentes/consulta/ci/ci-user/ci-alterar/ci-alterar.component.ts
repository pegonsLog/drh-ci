import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CiService, ComunicacaoInterna, NewComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../../../../services/funcionario.service';
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
    @Inject(CiService) private ciService: CiService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(FuncionarioService) private funcionarioService: FuncionarioService
  ) {
    this.ciForm = this.fb.group({
      de: [{ value: '', disabled: true }, Validators.required],
      para: [''], // Este controle agora armazenará a matrícula do destinatário
      comunicacao: ['', Validators.required],
      lancamentoStatus: [''],
      'destinatario_matricula-cc': [{value: '1197', disabled: true}]
    });
    this.funcionarios$ = this.funcionarioService.getGestores();
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
        comunicacao: ci.comunicacao,
        lancamentoStatus: ci.lancamentoStatus || 'pendente',
        'destinatario_matricula-cc': ci['destinatario_matricula-cc'] || ''
      });
    });
  }

  onSubmit(): void {
    if (this.ciForm.valid && this.ciId && this.originalCi) {
      const formValue = this.ciForm.getRawValue();

      this.funcionarios$.pipe(take(1)).subscribe(funcionarios => {
        const destinatarioMatricula = formValue.para;
        let para: string;
        let destinatario_matricula: string | null;

        if (destinatarioMatricula) {
          const destinatario = funcionarios.find(f => f.matricula.toString() === destinatarioMatricula.toString());
          if (!destinatario) {
            alert('O funcionário destinatário não foi encontrado. Por favor, selecione um válido.');
            return;
          }
          para = destinatario.funcionario;
          destinatario_matricula = String(destinatario.matricula);
        } else {
          para = 'Não se aplica';
          destinatario_matricula = null;
        }

        const ciAtualizada: Partial<ComunicacaoInterna> = {
          ...this.originalCi,
          comunicacao: formValue.comunicacao,
          para: para,
          destinatario_matricula: destinatario_matricula,
          lancamentoStatus: formValue.lancamentoStatus,
          'destinatario_matricula-cc': formValue['destinatario_matricula-cc'] ? String(formValue['destinatario_matricula-cc']) : undefined,
        };

        delete ciAtualizada.aprovacaoStatus;

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
            alert('Ocorreu um erro ao atualizar a Comunicação Interna.');
          });
      });
    }
  }
}
