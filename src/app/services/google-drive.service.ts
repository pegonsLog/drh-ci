import { Injectable, NgZone } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';

declare var google: any; // Declara a variável global 'google' para o Google Identity Services

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {

  // ATENÇÃO: O Client ID está exposto no frontend. 
  // Para um ambiente de produção, o fluxo de autenticação deve ser tratado por um backend seguro.
  private clientId = '801826585187-sgt389b16vv257cb1hpmbmt8ht481hra.apps.googleusercontent.com';
  private scope = 'https://www.googleapis.com/auth/drive.file';
  
  private tokenClient: any;

  constructor(private ngZone: NgZone) {}

  /**
   * Inicializa o cliente de token do Google e solicita o token de acesso.
   * Este método irá disparar o pop-up de consentimento do Google se for a primeira vez
   * ou se a permissão foi revogada.
   */
  private requestAccessToken(): Observable<string> {
    return new Observable((subscriber: Subscriber<string>) => {
      try {
        // Inicializa o cliente de token. Ele é reutilizável.
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: this.scope,
          callback: (tokenResponse: any) => {
            // O callback é executado fora da zona do Angular. Usamos ngZone para voltar.
            this.ngZone.run(() => {
              if (tokenResponse && tokenResponse.access_token) {
                subscriber.next(tokenResponse.access_token);
                subscriber.complete();
              } else {
                subscriber.error('Falha ao obter o token de acesso do Google.');
              }
            });
          },
        });
        // Solicita o token.
        this.tokenClient.requestAccessToken();
      } catch (error) {
        this.ngZone.run(() => subscriber.error(error));
      }
    });
  }

  /**
   * Orquestra o processo de upload: primeiro obtém um token de acesso e depois envia o arquivo.
   * @param pdfBlob O arquivo PDF como um Blob.
   * @param fileName O nome do arquivo a ser salvo no Google Drive.
   */
  uploadPdf(pdfBlob: Blob, fileName: string): Observable<any> {
    return new Observable(subscriber => {
      this.requestAccessToken().subscribe({
        next: (accessToken) => {
          const metadata = {
            name: fileName,
            mimeType: 'application/pdf',
            parents: ['1zdGIE10Bu9k3Uozt5uMRGpEytsVjFMtZ'] // ID da pasta de destino
          };

          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', pdfBlob);

          fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form,
          })
          .then(response => response.json())
          .then(data => {
            this.ngZone.run(() => {
              if (data.error) {
                console.error('Erro da API do Google Drive:', data.error);
                subscriber.error(data.error);
              } else {
                subscriber.next(data);
                subscriber.complete();
              }
            });
          })
          .catch(err => {
            this.ngZone.run(() => {
              console.error('Erro no fetch para o Google Drive:', err);
              subscriber.error(err);
            });
          });
        },
        error: (err) => {
          subscriber.error(err);
        }
      });
    });
  }
}
