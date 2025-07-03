import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EscalaService, Escala } from '../../../../services/escala.service';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-escala-alterar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './escala-alterar.component.html',
  styleUrl: './escala-alterar.component.scss'
})
export class EscalaAlterarComponent implements OnInit {
  escalaForm: FormGroup;
  escalaId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private escalaService: EscalaService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.escalaForm = this.fb.group({
      ano: ['', Validators.required],
      turno: ['', Validators.required],
      link: ['', [Validators.required, Validators.pattern(/^https?:\/\//)]]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.escalaId = params.get('id');
        if (this.escalaId) {
          return this.escalaService.getEscalaById(this.escalaId);
        }
        return of(null);
      })
    ).subscribe(escala => {
      if (escala) {
        this.escalaForm.patchValue(escala);
      }
    });
  }

  onSubmit(): void {
    if (this.escalaForm.valid && this.escalaId) {
      this.escalaService.updateEscala(this.escalaId, this.escalaForm.value)
        .then(() => {
          this.router.navigate(['/escala-listar']);
        })
        .catch(() => {
          alert('Erro ao atualizar escala.');
        });
    }
  }
}
