import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
      imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  matriculaForm: FormGroup;
  errorMessage: string | null = null;
  isGoogleLoggedIn = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.matriculaForm = this.fb.group({
      matricula: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]]
    });
  }

  loginWithGoogle(): void {
    this.errorMessage = null;
    this.authService.loginWithGoogle().subscribe({
      next: () => {
        this.isGoogleLoggedIn = true;
      },
      error: (err) => {
        console.error('Erro de login com Google:', err);
        this.errorMessage = 'Falha ao autenticar com o Google. Tente novamente.';
      }
    });
  }

  onContinue(): void {
    if (this.matriculaForm.invalid) {
      return;
    }
    const matricula = this.matriculaForm.value.matricula;
    // Navega para o painel, passando a matrícula como parâmetro
    this.router.navigate(['/painel', matricula]);
  }
}
