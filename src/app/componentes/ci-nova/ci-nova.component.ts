import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CiService } from '../../services/ci.service';

@Component({
  selector: 'app-ci-nova',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ci-nova.component.html',
  styleUrls: ['./ci-nova.component.scss']
})
export class CiNovaComponent {
  ciForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private ciService: CiService,
    private router: Router
  ) {
    this.ciForm = this.fb.group({
      de: ['', Validators.required],
      para: ['', Validators.required],
      comunicacao: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.ciForm.valid) {
      const formValue = this.ciForm.value;
      const novaCi = {
        ...formValue,
        data: new Date()
      };

      this.ciService.addCi(novaCi)
        .then(() => {
          console.log('CI adicionada com sucesso!');
          this.router.navigate(['/ci-listar']); // Navega para a lista após o sucesso
        })
        .catch(err => console.error('Erro ao adicionar CI:', err));
    }
  }
}
