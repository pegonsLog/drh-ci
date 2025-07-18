import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { CiService, NewComunicacaoInterna } from '../../../../../services/ci.service';
import { FuncionarioService, Funcionario } from '../../../../../services/funcionario.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-ci-nova',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './ci-nova.component.html',
  styleUrls: ['./ci-nova.component.scss']
})
export class CiNovaComponent implements OnInit {
  showPasteButton = false;
  ciForm: FormGroup;
  matricula: string | null = null;
  funcionarios$!: Observable<Funcionario[]>;
  funcionarios: Funcionario[] = [];

  constructor(
    private fb: FormBuilder,
    @Inject(CiService) private ciService: CiService,
    @Inject(FuncionarioService) private funcionarioService: FuncionarioService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.ciForm = this.fb.group({
      matricula: [{value: '', disabled: true}, Validators.required],
      de: [{value: '', disabled: true}, Validators.required],
      destinatario_matricula: [''],
      'destinatario_matricula-cc': [{value: '1197', disabled: true}],
      comunicacao: ['', Validators.required]
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: Event) {
    this.checkPasteButtonVisibility();
  }

  ngOnInit(): void {
    this.checkPasteButtonVisibility();
    this.funcionarios$ = this.funcionarioService.getGestores();
    this.funcionarios$.subscribe(data => this.funcionarios = data);

    this.matricula = this.route.snapshot.paramMap.get('matricula');
    if (this.matricula) {
      this.ciForm.patchValue({ matricula: this.matricula });
      this.funcionarioService.getFuncionarioByMatricula(this.matricula).subscribe(funcionario => {
        if (funcionario && funcionario.funcionario) {
          this.ciForm.patchValue({ de: funcionario.funcionario });
        }
      });
    }
  }

  async pasteFromClipboard(): Promise<void> {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      alert('Seu navegador não suporta a funcionalidade de colar programaticamente. Por favor, use a função de colar nativa do seu dispositivo (pressionar e segurar no campo de texto).');
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const currentText = this.ciForm.get('comunicacao')?.value || '';
        this.ciForm.patchValue({ comunicacao: currentText + text });
      }
    } catch (err) {
      console.error('Falha ao ler da área de transferência:', err);
      alert('Não foi possível colar. Por favor, verifique se você deu permissão ao site para acessar sua área de transferência. Em alguns navegadores, essa funcionalidade só está disponível em conexões seguras (HTTPS).');
    }
  }

  private checkPasteButtonVisibility(): void {
    const isHttps = this.document.location.protocol === 'https:';
    const isMobile = this.document.defaultView ? this.document.defaultView.innerWidth < 992 : false;
    this.showPasteButton = isMobile || isHttps;
  }

  onSubmit(): void {
    if (this.ciForm.valid) {
      const formValue = this.ciForm.getRawValue();
      const destinatarioMatriculaValue = formValue.destinatario_matricula;

      let para: string;
      let destinatario_matricula: string | null;

      if (destinatarioMatriculaValue) {
        const destinatario = this.funcionarios.find(
          f => f.matricula.toString() === destinatarioMatriculaValue.toString()
        );

        if (!destinatario) {
          alert('O funcionário destinatário não foi encontrado. Por favor, selecione um válido.');
          return;
        }
        para = destinatario.funcionario;
        destinatario_matricula = destinatarioMatriculaValue.toString();
      } else {
        para = 'Não se aplica';
        destinatario_matricula = null;
      }

      const novaCi: NewComunicacaoInterna = {
        de: formValue.de,
        comunicacao: formValue.comunicacao,
        para: para,
        data: new Date(),
        aprovacaoStatus: 'pendente',
        lancamentoStatus: 'pendente',
        matricula: formValue.matricula.toString(),
        destinatario_matricula: destinatario_matricula,
        'destinatario_matricula-cc': formValue['destinatario_matricula-cc'] ? formValue['destinatario_matricula-cc'].toString() : null
      };

      this.ciService.addCi(novaCi)
        .then(() => {
          if (this.matricula) {
            this.router.navigate(['/ci-listar', this.matricula]);
          } else {
            this.router.navigate(['/painel']); // Rota de fallback
          }
        })
        .catch(err => {
          console.error('Erro ao criar CI:', err);
          alert('Ocorreu um erro ao salvar a Comunicação Interna.');
        });
    }
  }
}
