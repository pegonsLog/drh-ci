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
      senhaAtual: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      novaSenha: ['', [Validators.required, Validators.minLength(6), Validators.pattern(/^[0-9]+$/)]],
      confirmarSenha: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]]
    }, { validator: this.senhasCoincidem });
  }

  ngOnInit(): void {}

  permitirApenasNumeros(event: KeyboardEvent): void {
    const charCode = (event.which) ? event.which : event.keyCode;
    // Permite: backspace, delete, tab, escape, enter
    if ([46, 8, 9, 27, 13].indexOf(charCode) !== -1 ||
        // Permite: Ctrl+A
        (charCode === 65 && event.ctrlKey === true) ||
        // Permite: home, end, left, right
        (charCode >= 35 && charCode <= 39)) {
        return;
    }
    // Garante que é um número e impede a entrada de outros caracteres
    if ((event.shiftKey || (charCode < 48 || charCode > 57)) && (charCode < 96 || charCode > 105)) {
      event.preventDefault();
    }
  }

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
