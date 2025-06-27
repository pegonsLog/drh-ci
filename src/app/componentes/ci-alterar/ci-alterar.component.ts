import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CiService, ComunicacaoInterna } from '../../services/ci.service';
import { switchMap, take, filter } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-ci-alterar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ci-alterar.component.html',
  styleUrls: ['./ci-alterar.component.scss']
})
export class CiAlterarComponent implements OnInit {
  ciForm: FormGroup;
  ciId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private ciService: CiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.ciForm = this.fb.group({
      de: ['', Validators.required],
      para: ['', Validators.required],
      comunicacao: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      take(1),
      switchMap(params => {
        this.ciId = params.get('id');
        if (this.ciId) {
          return this.ciService.getCi(this.ciId);
        }
        this.router.navigate(['/ci-listar']); // Se não houver ID, volta para a lista
        return of(null);
      }),
      filter((ci): ci is ComunicacaoInterna => ci !== null) // Garante que o valor não é nulo
    ).subscribe(ci => {
      this.ciForm.patchValue(ci);
    });
  }

  onSubmit(): void {
    if (this.ciForm.valid && this.ciId) {
      const ciAtualizada = {
        id: this.ciId,
        ...this.ciForm.value
      };

      this.ciService.updateCi(ciAtualizada)
        .then(() => {
          console.log('CI atualizada com sucesso!');
          this.router.navigate(['/ci-listar']);
        })
        .catch(err => console.error('Erro ao atualizar CI:', err));
    }
  }
}
