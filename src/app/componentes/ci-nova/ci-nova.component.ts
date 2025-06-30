import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CiService } from '../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../services/funcionario.service';
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
    private ciService: CiService,
    private funcionarioService: FuncionarioService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.ciForm = this.fb.group({
      matricula: [{value: '', disabled: true}, Validators.required],
      de: [{value: '', disabled: true}, Validators.required],
      destinatario_matricula: ['', Validators.required],
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
      
      const destinatarioMatricula = formValue.destinatario_matricula;
      const destinatario = this.funcionarios.find(f => f.matricula.toString() === destinatarioMatricula);

      if (!destinatario) {
        // Idealmente, mostrar um erro para o usuário aqui
        return;
      }

      const novaCi = {
        ...formValue,
        para: destinatario.funcionario, // Adiciona o nome do funcionário
        data: new Date() // Corrigido para ser uma chamada de função
      };

      this.ciService.addCi(novaCi)
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
