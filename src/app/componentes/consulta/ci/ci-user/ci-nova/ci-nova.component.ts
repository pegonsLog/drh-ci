import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CiService, NewComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../../../../services/funcionario.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-ci-nova',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './ci-nova.component.html',
  styleUrls: ['./ci-nova.component.scss']
})
export class CiNovaComponent implements OnInit {
  ciForm: FormGroup;
  matricula: string | null = null;
  funcionarios$!: Observable<Funcionario[]>;
  funcionarios: Funcionario[] = [];

  constructor(
    private fb: FormBuilder,
    @Inject(CiService) private ciService: CiService,
    @Inject(FuncionarioService) private funcionarioService: FuncionarioService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.ciForm = this.fb.group({
      matricula: [{value: '', disabled: true}, Validators.required],
      de: [{value: '', disabled: true}, Validators.required],
      destinatario_matricula: [''],
      'destinatario_matricula-cc': [{value: '1197', disabled: true}],
      comunicacao: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.funcionarios$ = this.funcionarioService.getGestores();
    this.funcionarios$.subscribe(data => this.funcionarios = data);

    this.matricula = this.route.snapshot.paramMap.get('matricula');
    if (this.matricula) {
      this.ciForm.patchValue({ matricula: this.matricula });
      this.funcionarioService.getFuncionarioByMatricula(this.matricula).subscribe(funcionario => {
        if (funcionario && funcionario.funcionario) {
          this.ciForm.patchValue({ de: funcionario.funcionario });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.ciForm.valid) {
      const formValue = this.ciForm.getRawValue();
      const destinatarioMatriculaValue = formValue.destinatario_matricula;

      let para: string;
      let destinatario_matricula: string | null;

      if (destinatarioMatriculaValue) {
        const destinatario = this.funcionarios.find(
          f => f.matricula.toString() === destinatarioMatriculaValue.toString()
        );

        if (!destinatario) {
          alert('O funcionário destinatário não foi encontrado. Por favor, selecione um válido.');
          return;
        }
        para = destinatario.funcionario;
        destinatario_matricula = destinatarioMatriculaValue.toString();
      } else {
        para = 'Não se aplica';
        destinatario_matricula = null;
      }

      const novaCi: NewComunicacaoInterna = {
        de: formValue.de,
        comunicacao: formValue.comunicacao,
        para: para,
        data: new Date(),
        aprovacaoStatus: 'pendente',
        lancamentoStatus: 'pendente',
        matricula: formValue.matricula.toString(),
        destinatario_matricula: destinatario_matricula,
        'destinatario_matricula-cc': formValue['destinatario_matricula-cc'] ? formValue['destinatario_matricula-cc'].toString() : null
      };

      this.ciService.addCi(novaCi)
        .then(() => {
          if (this.matricula) {
            this.router.navigate(['/ci-listar', this.matricula]);
          } else {
            this.router.navigate(['/painel']); // Rota de fallback
          }
        })
        .catch(err => {
          console.error('Erro ao criar CI:', err);
          alert('Ocorreu um erro ao salvar a Comunicação Interna.');
        });
    }
  }
}
