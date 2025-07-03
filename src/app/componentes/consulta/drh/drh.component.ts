import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NotionService } from '../../../services/notion.service';
import { CommonModule, DatePipe } from '@angular/common';
import { AbbreviateYearPipe } from '../../../pipes/abbreviate-year.pipe';


@Component({
  selector: 'app-drh',
  standalone: true,
  imports: [CommonModule, DatePipe, AbbreviateYearPipe],
  templateUrl: './drh.component.html',
  styleUrl: './drh.component.scss'
})
export class DrhComponent implements OnChanges {
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

    this.notionService.queryDatabaseDrh(this.matricula).subscribe({
      next: (response: any) => {

        this.notionData = response.results.sort((a: any, b: any) => {
          const aquisitivoA = a.properties['Aquisitivo']?.multi_select?.[0]?.name || '';
          const aquisitivoB = b.properties['Aquisitivo']?.multi_select?.[0]?.name || '';

          // Ordena em ordem decrescente (do mais recente para o mais antigo)
          return aquisitivoB.localeCompare(aquisitivoA);
        });
        this.isLoading = false;
      },
      error: (err: any) => {

        this.isLoading = false;
      }
    });
  }
}
