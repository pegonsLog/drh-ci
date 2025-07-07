import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { FuncionarioService } from '../../../services/funcionario.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loginError: string | null = null;
  isLoggedIn = false;
  userProfile: string | null = null;
  private perfilSubscription: Subscription | undefined;

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
    this.perfilSubscription = this.funcionarioService.perfilUsuario$.subscribe(perfil => {
      this.userProfile = perfil;
      this.isLoggedIn = !!perfil;
    });
  }

  ngOnDestroy(): void {
    if (this.perfilSubscription) {
      this.perfilSubscription.unsubscribe();
    }
  }

  get canAccessAprovacao(): boolean {
    return this.userProfile === 'gestor' || this.userProfile === 'adm';
  }

  get canAccessLancamento(): boolean {
    return this.userProfile === 'lancador' || this.userProfile === 'apurador' || this.userProfile === 'adm';
  }

  get canAccessApuracao(): boolean {
    return this.userProfile === 'apurador' || this.userProfile === 'lancador' || this.userProfile === 'adm';
  }

  loginAndNavigate(route: string): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.loginError = 'Por favor, preencha a matrícula e a senha.';
      return;
    }

    this.loginError = null;
    const { matricula, senha } = this.loginForm.value;

    this.funcionarioService.login(matricula, senha).subscribe({
      next: (response) => {
        if (response.success) {
          let authorized = false;
          switch (route) {
            case 'ci-painel':
              authorized = true;
              break;
            case 'ci-listar-aprovacao':
              authorized = this.canAccessAprovacao;
              break;
            case 'ci-listar-lancamento':
              authorized = this.canAccessLancamento;
              break;
            case 'ci-listar-apuracao':
              authorized = this.canAccessApuracao;
              break;
          }

          if (authorized) {
            const matriculaLogada = this.funcionarioService.getMatriculaLogada();
            if (!matriculaLogada) {
              this.loginError = "Sessão expirada ou matrícula não encontrada. Faça o login novamente.";
              this.logout();
              return;
            }

            const routesWithMatricula = ['ci-listar-aprovacao', 'ci-listar-apuracao', 'ci-listar-lancamento'];

            if (route === 'ci-painel') {
              this.router.navigate(['/painel', matriculaLogada]);
            } else if (routesWithMatricula.includes(route)) {
              this.router.navigate([`/${route}`, matriculaLogada]);
            } else {
              this.router.navigate([`/${route}`]);
            }
          } else {
            this.loginError = 'Você não tem privilégios para acessar esta seção.';
            this.logout();
          }
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

  logout(): void {
    this.funcionarioService.logout();
  }
}
