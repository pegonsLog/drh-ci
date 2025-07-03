import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotionService {
  // URL da Cloud Function que atua como proxy seguro para a API do Notion.
  private notionProxyUrl = 'https://us-central1-drh-ci.cloudfunctions.net/notionProxy';

  // IDs dos bancos de dados do Notion.
  private databaseIdDrh = '9440143e0a1148b29861860de1653774';
  private databaseIdTre = '2a830d99c7104bb2bbd7aa1b9033033d';
  private databaseIdPf = 'b38738330a5f418aae30f667c0110bf3';

  constructor(private http: HttpClient) { }

  private queryDatabase(databaseId: string, matriculaPropertyName: string, matricula: string): Observable<any> {
    // Monta o corpo da requisição para a Cloud Function.
    // A chave da API do Notion NÃO é mais necessária aqui, pois está segura na Cloud Function.
    const body = {
      databaseId: databaseId,
      filter: {
        property: matriculaPropertyName,
        title: {
          equals: matricula
        }
      }
    };

    // Chama a Cloud Function, que fará a chamada segura para o Notion.
    return this.http.post(this.notionProxyUrl, body);
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
