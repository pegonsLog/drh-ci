import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FuncionarioService, Funcionario } from '../../services/funcionario.service';
import { switchMap, of } from 'rxjs';

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
      funcionario: ['', Validators.required],
      matricula: [{value: '', disabled: true}, Validators.required]
    });
  }

  ngOnInit(): void {
    this.matriculaLogado = this.route.snapshot.paramMap.get('matricula');
    this.funcionarioService.perfilUsuario$.subscribe(perfil => {
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
    if (this.funcionarioForm.valid && this.funcionarioId) {
      this.funcionarioService.updateFuncionario(this.funcionarioId, this.funcionarioForm.value)
        .subscribe(success => {
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
}
