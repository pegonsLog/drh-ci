import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface ComunicacaoInterna {
  id?: string;
  de: string;
  para: string;
  data: Date;
  comunicacao: string;
  matricula: string; // Matrícula do remetente
  destinatario_matricula?: string; // Matrícula do destinatário
}

@Injectable({
  providedIn: 'root'
})
export class CiService {
  private ciCollection: any;

  constructor(private firestore: Firestore) {
    this.ciCollection = collection(this.firestore, 'cis');
  }

  // Adicionar uma nova CI
  addCi(ci: ComunicacaoInterna) {
    return addDoc(this.ciCollection, ci);
  }

  // Obter todas as CIs
  getCis(): Observable<ComunicacaoInterna[]> {
    return collectionData(this.ciCollection, { idField: 'id' }) as Observable<ComunicacaoInterna[]>;
  }

  // Obter uma CI específica pelo ID
  getCi(id: string): Observable<ComunicacaoInterna> {
    const ciDocRef = doc(this.firestore, `cis/${id}`);
    return docData(ciDocRef, { idField: 'id' }) as Observable<ComunicacaoInterna>;
  }

  // Atualizar uma CI
  updateCi(ci: ComunicacaoInterna) {
    const ciDocRef = doc(this.firestore, `cis/${ci.id}`);
    return updateDoc(ciDocRef, { ...ci });
  }

  // Apagar uma CI
  deleteCi(id: string) {
    const ciDocRef = doc(this.firestore, `cis/${id}`);
    return deleteDoc(ciDocRef);
  }
}
