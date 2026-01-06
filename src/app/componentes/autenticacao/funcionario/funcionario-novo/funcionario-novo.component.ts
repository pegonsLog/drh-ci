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
  selectedFileName: string | null = null;
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
      const file = target.files[0];
      
      // Validar tipo de arquivo
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Por favor, selecione apenas arquivos PNG ou JPEG.');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB em bytes
      if (file.size > maxSize) {
        alert('O arquivo deve ter no máximo 5MB.');
        return;
      }
      
      this.selectedFile = file;
      this.selectedFileName = file.name;
      console.log('Arquivo selecionado:', file.name, 'Tamanho:', file.size, 'bytes');
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
      console.log('Iniciando criação de funcionário...');
      console.log('Arquivo selecionado:', this.selectedFile ? this.selectedFile.name : 'Nenhum');
      
      this.funcionarioService.addFuncionario(this.funcionarioForm.value).pipe(
        switchMap((id: string | null) => {
          console.log('Funcionário criado com ID:', id);
          
          if (id && this.selectedFile) {
            console.log('Iniciando upload da assinatura...');
            // Se tem um arquivo, faz o upload e depois atualiza o funcionário
            return this.funcionarioService.uploadAssinatura(id, this.selectedFile).pipe(
              switchMap(url => {
                console.log('URL da assinatura:', url);
                
                if (!url) {
                  // Mesmo que o upload falhe, o funcionário foi criado. O usuário pode tentar de novo.
                  console.error('Upload da assinatura falhou, mas o funcionário foi criado.');
                  alert('Funcionário criado, mas houve erro ao fazer upload da assinatura. Você pode adicionar a assinatura depois.');
                  return of(id); // Retorna o ID para navegação
                }
                // Atualiza o funcionário com a URL da assinatura
                console.log('Atualizando funcionário com URL da assinatura...');
                return this.funcionarioService.updateFuncionario(id, { assinaturaDigitalUrl: url }).pipe(
                  switchMap(() => {
                    console.log('Funcionário atualizado com sucesso!');
                    return of(id);
                  })
                );
              })
            );
          }
          // Se não tem arquivo, apenas retorna o ID do funcionário criado
          console.log('Nenhum arquivo para upload, finalizando...');
          return of(id);
        })
      ).subscribe({
        next: (id: string | null) => {
          this.isUploading = false;
          if (id) {
            alert('Funcionário criado com sucesso!');
            if (this.matriculaLogado) {
              this.router.navigate(['/funcionario-listar', this.matriculaLogado]);
            }
          } else {
            alert('Erro ao criar funcionário.');
          }
        },
        error: (error) => {
          console.error('Erro no processo:', error);
          this.isUploading = false;
          alert('Erro ao criar funcionário: ' + error.message);
        }
      });
    }
  }
}
