import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NotionService } from '../../../services/notion.service';
import { CommonModule, DatePipe } from '@angular/common';
import { AbbreviateYearPipe } from '../../../pipes/abbreviate-year.pipe';

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

        this.notionData = response.results.sort((a: any, b: any) => {
          const eleicaoA = a.properties['Eleicao']?.multi_select?.[0]?.name || '';
          const eleicaoB = b.properties['Eleicao']?.multi_select?.[0]?.name || '';

          // Ordena em ordem decrescente (do mais recente para o mais antigo)
          return eleicaoB.localeCompare(eleicaoA);
        });
        this.isLoading = false;
      },
      error: (err: any) => {

        this.isLoading = false;
      }
    });
  }
}
