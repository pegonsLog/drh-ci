import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NotionService } from '../../services/notion.service';
import { CommonModule, DatePipe } from '@angular/common';
import { AbbreviateYearPipe } from '../../pipes/abbreviate-year.pipe';

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
          const dateA = a.properties['Data folga']?.date?.start;
          const dateB = b.properties['Data folga']?.date?.start;

          if (dateA && !dateB) return 1;
          if (!dateA && dateB) return -1;
          if (!dateA && !dateB) return 0;
          
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        this.isLoading = false;
      },
      error: (err: any) => {

        this.isLoading = false;
      }
    });
  }
}
