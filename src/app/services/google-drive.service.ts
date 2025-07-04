import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {

  // URL da Cloud Function. Substitua 'drh-ci' pelo seu ID de projeto se for diferente.
  private functionUrl = 'https://us-central1-drh-ci.cloudfunctions.net/uploadPdfToDrive';

  constructor(private http: HttpClient) {}

  /**
   * Converte um Blob para uma string base64.
   * @param blob O Blob a ser convertido.
   */
  private blobToBase64(blob: Blob): Observable<string> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.onerror = err => observer.error(err);
      reader.onabort = err => observer.error(err);
      reader.onload = () => {
        // O resultado é uma data URL (e.g., 'data:application/pdf;base64,JVBERi...'),
        // então pegamos apenas a parte do base64.
        const base64String = (reader.result as string).split(',')[1];
        observer.next(base64String);
        observer.complete();
      };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Chama a Cloud Function para fazer o upload do PDF.
   * @param pdfBlob O arquivo PDF como um Blob.
   * @param fileName O nome do arquivo.
   */
  uploadPdf(pdfBlob: Blob, fileName: string): Observable<any> {
    return this.blobToBase64(pdfBlob).pipe(
      switchMap(base64Content => {
        const payload = {
          fileContent: base64Content,
          fileName: fileName
        };
        return this.http.post(this.functionUrl, payload);
      })
    );
  }
}

