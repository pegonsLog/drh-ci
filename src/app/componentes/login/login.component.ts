import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { FuncionarioService } from '../../services/funcionario.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loginError: string | null = null;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private funcionarioService: FuncionarioService
  ) {
        this.loginForm = this.fb.group({
      matricula: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      senha: ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.loginError = null;
    const { matricula, senha } = this.loginForm.value;

    this.funcionarioService.login(matricula, senha).subscribe({
      next: (response) => {
        if (response.success && response.matricula) {
          this.router.navigate(['/painel', response.matricula]);
        } else {
          this.loginError = 'Matrícula ou senha inválida. Verifique os dados e tente novamente.';
        }
      },
      error: (err) => {
        console.error('Erro na autenticação:', err);
        this.loginError = 'Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.';
      }
    });
  }
}
