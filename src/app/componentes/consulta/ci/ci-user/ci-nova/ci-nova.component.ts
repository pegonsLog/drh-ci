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
      destinatario_matricula: ['', Validators.required],
      'destinatario_matricula-cc': [''],
      comunicacao: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.funcionarios$ = this.funcionarioService.getFuncionarios();
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

      // Compara os valores como strings para garantir a correspondência correta
      const destinatario = this.funcionarios.find(
        f => f.matricula.toString() === destinatarioMatriculaValue.toString()
      );

      if (!destinatario) {
        alert('O funcionário destinatário não foi encontrado. Por favor, selecione um válido.');
        return;
      }

      // Constrói o objeto `novaCi` explicitamente para garantir a consistência dos tipos
      const novaCi: NewComunicacaoInterna = {
        de: formValue.de,
        comunicacao: formValue.comunicacao,
        para: destinatario.funcionario,
        data: new Date(),
        aprovacaoStatus: 'pendente', // Define o status inicial como pendente
        lancamentoStatus: 'pendente', // Define o status de lançamento inicial
        // Garante que ambas as matrículas sejam salvas como STRINGS
        matricula: formValue.matricula.toString(),
        destinatario_matricula: destinatarioMatriculaValue.toString(),
        'destinatario_matricula-cc': formValue['destinatario_matricula-cc'] ? formValue['destinatario_matricula-cc'].toString() : undefined
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
