import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CiService, ComunicacaoInterna } from '../../../../../services/ci.service';
import { filter, take, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-ci-alterar-aprovacao',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './ci-alterar-aprovacao.component.html',
  styleUrls: ['./ci-alterar-aprovacao.component.scss']
})
export class CiAlterarAprovacaoComponent implements OnInit {
  aprovacaoForm: FormGroup;
  ciId: string | null = null;
  matricula: string | null = null;
  ci$: Observable<ComunicacaoInterna | null>;

  constructor(
    private fb: FormBuilder,
    @Inject(CiService) private ciService: CiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.aprovacaoForm = this.fb.group({
      aprovacaoStatus: ['', Validators.required]
    });
    this.ci$ = of(null); // Inicializa ci$
  }

  ngOnInit(): void {
    this.ciId = this.route.snapshot.paramMap.get('id');
    this.matricula = this.route.snapshot.paramMap.get('matricula');

    if (this.ciId) {
      this.ci$ = this.ciService.getCi(this.ciId).pipe(
        map((ci: ComunicacaoInterna | null) => {
          if (ci && ci.data && typeof (ci.data as any).toDate === 'function') {
            return { ...ci, data: (ci.data as any).toDate() };
          }
          return ci;
        })
      );
      this.ci$.pipe(
          filter((ci): ci is ComunicacaoInterna => ci !== null),
          take(1)
      ).subscribe(ci => {
          this.aprovacaoForm.patchValue({
              aprovacaoStatus: ci.aprovacaoStatus
          });
      });
    }
  }

  onSubmit(): void {
    if (this.aprovacaoForm.valid && this.ciId) {
      const status = this.aprovacaoForm.value.aprovacaoStatus;
      if (status === 'aprovado' || status === 'reprovado' || status === 'pendente') {
        this.ciService.updateAprovacaoStatus(this.ciId, status)
          .then(() => {
            if (this.matricula) {
              this.router.navigate(['/ci-listar-aprovacao', this.matricula]);
            } else {
              // Fallback ou tratar erro, pois a matrícula é necessária para a rota de lista
              console.error('Matrícula não encontrada, não é possível voltar para a lista.');
              this.router.navigate(['/']); // ou uma rota de fallback
            }
          })
          .catch((err: any) => {
            console.error('Erro ao atualizar status da CI:', err);
          });
      }
    }
  }
}
