import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { FuncionarioService } from '../../../../services/funcionario.service';

@Component({
  selector: 'app-funcionario-alterar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './funcionario-alterar.component.html',
  styleUrls: ['./funcionario-alterar.component.scss']
})
export class FuncionarioAlterarComponent implements OnInit {
  funcionarioForm: FormGroup;
  funcionarioId: string | null = null;
  matriculaLogado: string | null = null;

  constructor(
    private fb: FormBuilder,
    private funcionarioService: FuncionarioService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.funcionarioForm = this.fb.group({
      funcionario: [{value: '', disabled: true}, Validators.required],
      matricula: [{value: '', disabled: true}, Validators.required],
      perfil: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['']
    });
  }

  ngOnInit(): void {
    this.matriculaLogado = this.route.snapshot.paramMap.get('matricula');
        this.funcionarioService.perfilUsuario$.subscribe((perfil: string | null) => {
      if (perfil !== 'adm') {
        this.router.navigate(['/painel', this.matriculaLogado]);
      }
    });
    this.route.paramMap.pipe(
      switchMap(params => {
        this.funcionarioId = params.get('id');
        if (this.funcionarioId) {
          return this.funcionarioService.getFuncionarioById(this.funcionarioId);
        }
        return of(null);
      })
    ).subscribe(funcionario => {
      if (funcionario) {
        this.funcionarioForm.patchValue(funcionario);
      }
    });
  }

  onSubmit(): void {
    if (!this.funcionarioForm.valid || !this.funcionarioId) {
      return;
    }

    // Obtém todos os valores, incluindo os desabilitados como a matrícula
    const dadosAtualizados = this.funcionarioForm.getRawValue();

    this.funcionarioService.updateFuncionario(this.funcionarioId, dadosAtualizados)
      .subscribe((success: any) => {
        if (success) {
          if (this.matriculaLogado) {
            this.router.navigate(['/funcionario-listar', this.matriculaLogado]);
          }
        } else {
          alert('Erro ao atualizar funcionário.');
        }
      });
  }
}
