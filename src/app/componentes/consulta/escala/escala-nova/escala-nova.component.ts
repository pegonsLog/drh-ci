import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EscalaService } from '../../../../services/escala.service';

@Component({
  selector: 'app-escala-nova',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './escala-nova.component.html',
  styleUrl: './escala-nova.component.scss'
})
export class EscalaNovaComponent implements OnInit {
  escalaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private escalaService: EscalaService,
    private router: Router
  ) {
    this.escalaForm = this.fb.group({
      ano: ['', Validators.required],
      link: ['', [Validators.required, Validators.pattern(/^https?:\/\//)]],
      turno: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.escalaForm.valid) {
      this.escalaService.addEscala(this.escalaForm.value).then(() => {
        this.router.navigate(['/escala-listar']);
      }).catch(() => {
        alert('Erro ao criar escala.');
      });
    }
  }
}
