import { Injectable } from '@angular/core';
import { Firestore, collectionData, collection, doc, docData, addDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Escala {
  id?: string;
  ano: string;
  link: string;
  turno: string;
  deletado?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EscalaService {
  private collectionName = 'escalas';

  constructor(private firestore: Firestore) {}

  getEscalas(): Observable<Escala[]> {
    const escalaRef = collection(this.firestore, this.collectionName);
    return collectionData(escalaRef, { idField: 'id' }) as Observable<Escala[]>;
  }

  getEscalaById(id: string): Observable<Escala | undefined> {
    const escalaDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return docData(escalaDoc, { idField: 'id' }) as Observable<Escala | undefined>;
  }

  addEscala(escala: Escala): Promise<any> {
    const escalaRef = collection(this.firestore, this.collectionName);
    return addDoc(escalaRef, escala);
  }

  updateEscala(id: string, escala: Partial<Escala>): Promise<void> {
    const escalaDoc = doc(this.firestore, `${this.collectionName}/${id}`);
    return updateDoc(escalaDoc, escala);
  }
}