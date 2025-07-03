import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NotionService } from '../../../services/notion.service';
import { CommonModule, DatePipe } from '@angular/common';
import { AbbreviateYearPipe } from '../../../pipes/abbreviate-year.pipe';

@Component({
  selector: 'app-pf',
  standalone: true,
  imports: [CommonModule, DatePipe, AbbreviateYearPipe],
  templateUrl: './pf.component.html',
  styleUrl: './pf.component.scss'
})
export class PfComponent implements OnChanges {
  @Input() matricula: string | null = null;
  notionData: any[] = [];
  isLoading = true;

  constructor(private notionService: NotionService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matricula'] && this.matricula) {
      this.loadData();
    }
  }

  private loadData(): void {
    if (!this.matricula) {
      this.isLoading = false;
      return;
    }
    this.isLoading = true;

    this.notionService.queryDatabasePf(this.matricula).subscribe({
      next: (response: any) => {

        this.notionData = response.results.sort((a: any, b: any) => {
          const toDate = (dateStr: string | null): Date | null => {
            if (!dateStr) return null;
            const parts = dateStr.split('/');
            if (parts.length !== 3) return null;
            // Adiciona o século '20' ao ano com dois dígitos
            return new Date(parseInt(parts[2], 10) + 2000, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          };

          const dateA = toDate(a.properties['Ponto Facultativo']?.multi_select?.[0]?.name);
          const dateB = toDate(b.properties['Ponto Facultativo']?.multi_select?.[0]?.name);

          if (dateA && dateB) {
            // Ordena da data mais recente para a mais antiga
            return dateB.getTime() - dateA.getTime();
          }
          // Itens com datas nulas ou inválidas vão para o final
          return dateA ? -1 : (dateB ? 1 : 0);
        });
        this.isLoading = false;
      },
      error: (err: any) => {

        this.isLoading = false;
      }
    });
  }
}
