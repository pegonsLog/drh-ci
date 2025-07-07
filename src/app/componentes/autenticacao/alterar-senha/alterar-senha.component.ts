import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FuncionarioService } from '../../../services/funcionario.service';

@Component({
  selector: 'app-alterar-senha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, RouterLink],
  templateUrl: './alterar-senha.component.html',
  styleUrls: ['./alterar-senha.component.scss']
})
export class AlterarSenhaComponent implements OnInit {
  alterarSenhaForm: FormGroup;
  mensagem: string | null = null;
  isError: boolean = false;

  constructor(
    private fb: FormBuilder,
    private funcionarioService: FuncionarioService,
    private router: Router
  ) {
    this.alterarSenhaForm = this.fb.group({
      matricula: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      senhaAtual: ['', Validators.required],
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required]
    }, { validator: this.senhasCoincidem });
  }

  ngOnInit(): void {}

  senhasCoincidem(group: FormGroup) {
    const novaSenha = group.controls['novaSenha'].value;
    const confirmarSenha = group.controls['confirmarSenha'].value;
    return novaSenha === confirmarSenha ? null : { senhasNaoCoincidem: true };
  }

  onSubmit(): void {
    if (this.alterarSenhaForm.invalid) {
      if (this.alterarSenhaForm.errors?.['senhasNaoCoincidem']) {
        this.mensagem = 'As senhas não coincidem.';
        this.isError = true;
      }
      return;
    }

    this.mensagem = null;
    this.isError = false;
    const { matricula, senhaAtual, novaSenha } = this.alterarSenhaForm.value;

    this.funcionarioService.alterarSenha(matricula, senhaAtual, novaSenha).subscribe({
      next: (sucesso: boolean) => {
        if (sucesso) {
          this.mensagem = 'Senha alterada com sucesso! Você será redirecionado para o login em 3 segundos.';
          this.isError = false;
          this.alterarSenhaForm.reset();
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          this.mensagem = 'Matrícula ou senha atual incorreta. Verifique os dados e tente novamente.';
          this.isError = true;
        }
      },
      error: () => {
        this.mensagem = 'Ocorreu um erro de comunicação com o servidor. Tente novamente mais tarde.';
        this.isError = true;
      }
    });
  }
}
