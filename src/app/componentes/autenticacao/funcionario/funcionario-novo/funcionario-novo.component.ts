import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FuncionarioService } from '../../../../services/funcionario.service';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-funcionario-novo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './funcionario-novo.component.html',
  styleUrls: ['./funcionario-novo.component.scss']
})
export class FuncionarioNovoComponent implements OnInit {
  selectedFile: File | null = null;
  isUploading = false;
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

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];
    }
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
      this.isUploading = true;
      this.funcionarioService.addFuncionario(this.funcionarioForm.value).pipe(
        switchMap((id: string | null) => {
          if (id && this.selectedFile) {
            // Se tem um arquivo, faz o upload e depois atualiza o funcionário
            return this.funcionarioService.uploadAssinatura(id, this.selectedFile).pipe(
              switchMap(url => {
                if (!url) {
                  // Mesmo que o upload falhe, o funcionário foi criado. O usuário pode tentar de novo.
                  console.error('Upload da assinatura falhou, mas o funcionário foi criado.');
                  return of(id); // Retorna o ID para navegação
                }
                // Atualiza o funcionário com a URL da assinatura
                return this.funcionarioService.updateFuncionario(id, { assinaturaDigitalUrl: url }).pipe(
                  switchMap(() => of(id)) // Continua com o ID do funcionário
                );
              })
            );
          }
          // Se não tem arquivo, apenas retorna o ID do funcionário criado
          return of(id);
        })
      ).subscribe((id: string | null) => {
        this.isUploading = false;
        if (id) {
          alert('Funcionário criado com sucesso!');
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
