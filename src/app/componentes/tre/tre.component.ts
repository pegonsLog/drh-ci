import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NotionService } from '../../services/notion.service';
import { CommonModule, DatePipe } from '@angular/common';
import { AbbreviateYearPipe } from '../../pipes/abbreviate-year.pipe';

@Component({
  selector: 'app-tre',
  standalone: true,
  imports: [CommonModule, DatePipe, AbbreviateYearPipe],
  templateUrl: './tre.component.html',
  styleUrls: ['./tre.component.scss']
})
export class TreComponent implements OnChanges {
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

    this.notionService.queryDatabaseTre(this.matricula).subscribe({
      next: (response: any) => {
        console.log('Dados TRE recebidos do Notion:', response);
        this.notionData = response.results.sort((a: any, b: any) => {
          const dateA = a.properties['Data do TRE']?.date?.start;
          const dateB = b.properties['Data do TRE']?.date?.start;

          if (dateA && !dateB) return 1;
          if (!dateA && dateB) return -1;
          if (!dateA && !dateB) return 0;
          
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erro ao buscar dados do TRE:', err);
        this.isLoading = false;
      }
    });
  }
}
