import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DrhComponent } from "../drh/drh.component";
import { TreComponent } from "../tre/tre.component";
import { PfComponent } from "../pf/pf.component";

@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [RouterModule, DrhComponent, TreComponent, PfComponent],
  templateUrl: './painel.component.html',
  styleUrl: './painel.component.scss'
})
export class PainelComponent implements OnInit {
  matricula: string | null = null;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.matricula = params.get('matricula');
      // Agora você pode usar this.matricula para filtrar dados
      console.log('Matrícula recebida:', this.matricula);
    });
  }
}
