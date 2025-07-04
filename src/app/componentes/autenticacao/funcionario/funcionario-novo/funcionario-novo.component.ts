import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FuncionarioService } from '../../../../services/funcionario.service';

@Component({
  selector: 'app-funcionario-novo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './funcionario-novo.component.html',
  styleUrls: ['./funcionario-novo.component.scss']
})
export class FuncionarioNovoComponent implements OnInit {
  funcionarioForm: FormGroup;
  matriculaLogado: string | null = null;

  constructor(
    private fb: FormBuilder,
    private funcionarioService: FuncionarioService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.funcionarioForm = this.fb.group({
      funcionario: ['', Validators.required],
      matricula: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      perfil: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.matriculaLogado = this.route.snapshot.paramMap.get('matricula');
        this.funcionarioService.perfilUsuario$.subscribe((perfil: string | null) => {
      if (perfil !== 'adm') {
        this.router.navigate(['/painel', this.matriculaLogado]);
      }
    });
  }

  onSubmit(): void {
    if (this.funcionarioForm.valid) {
            this.funcionarioService.addFuncionario(this.funcionarioForm.value).subscribe((id: string | null) => {
        if (id) {
          if (this.matriculaLogado) {
            this.router.navigate(['/funcionario-listar', this.matriculaLogado]);
          }
        } else {
          alert('Erro ao criar funcionário.');
        }
      });
    }
  }
}
