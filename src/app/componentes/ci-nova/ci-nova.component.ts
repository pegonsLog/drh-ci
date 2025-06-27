import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CiService } from '../../services/ci.service';
import { FuncionarioService } from '../../services/funcionario.service';

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
      para: ['', Validators.required],
      comunicacao: ['', Validators.required]
    });
  }

  ngOnInit(): void {
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
      const formValue = this.ciForm.getRawValue(); // Usa getRawValue() para incluir campos desabilitados
      const novaCi = {
        ...formValue,
        data: new Date()
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
