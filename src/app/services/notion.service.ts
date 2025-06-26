import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotionService {
  private notionApiUrl = '/api/v1/databases/';

  private databaseIdDrh = '9440143e0a1148b29861860de1653774';
  private databaseIdTre = '2a830d99c7104bb2bbd7aa1b9033033d';
  private databaseIdPf = 'b38738330a5f418aae30f667c0110bf3';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private createFilterBody(matricula: string, propertyName: string) {
    return {
      filter: {
        property: propertyName,
        title: {
          contains: matricula
        }
      }
    };
  }

  private queryDatabase(databaseId: string, matriculaPropertyName: string, matricula: string): Observable<any> {
    return this.authService.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return of({ results: [] }); // Retorna vazio se não houver usuário logado
        }

        const body = this.createFilterBody(matricula, matriculaPropertyName);
        const url = `${this.notionApiUrl}${databaseId}/query`;
        return this.http.post(url, body);
      })
    );
  }

  queryDatabaseDrh(matricula: string): Observable<any> {
    return this.queryDatabase(this.databaseIdDrh, 'Matricula', matricula);
  }

  queryDatabaseTre(matricula: string): Observable<any> {
    return this.queryDatabase(this.databaseIdTre, 'Matricula', matricula);
  }

  queryDatabasePf(matricula: string): Observable<any> {
    return this.queryDatabase(this.databaseIdPf, 'Matricula', matricula);
  }
}
