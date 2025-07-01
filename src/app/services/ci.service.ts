import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, docData, query, where, orderBy, CollectionReference } from '@angular/fire/firestore';
import { Observable, filter, map } from 'rxjs';

// Interface para CIs que ainda não foram salvas (sem id)
export interface NewComunicacaoInterna {
  de: string;
  para: string;
  data: Date;
  comunicacao: string;
  matricula: string;
  destinatario_matricula?: string;
}

// Interface para CIs que vêm do banco (com id obrigatório)
export interface ComunicacaoInterna extends NewComunicacaoInterna {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class CiService {
  // Usar uma referência de coleção não tipada para evitar conflitos
  private ciCollection: CollectionReference;

  constructor(private firestore: Firestore) {
    this.ciCollection = collection(this.firestore, 'cis');
  }

  addCi(ci: NewComunicacaoInterna) {
    return addDoc(this.ciCollection, ci);
  }

  getCis(): Observable<ComunicacaoInterna[]> {
    return collectionData(this.ciCollection, { idField: 'id' }) as Observable<ComunicacaoInterna[]>;
  }

  getCisPorUsuario(matricula: string): Observable<ComunicacaoInterna[]> {
    const q = query(this.ciCollection, where('matricula', '==', matricula), orderBy('data', 'desc'));
    return (collectionData(q, { idField: 'id' }) as Observable<ComunicacaoInterna[]>).pipe(
      map(cis => {
        // Garante a ordenação no lado do cliente para lidar com quaisquer inconsistências
        return cis.sort((a, b) => {
          const dateA = a.data as any;
          const dateB = b.data as any;
          const timeA = dateA?.toDate ? dateA.toDate().getTime() : new Date(dateA).getTime();
          const timeB = dateB?.toDate ? dateB.toDate().getTime() : new Date(dateB).getTime();
          return timeB - timeA; // Descendente
        });
      })
    );
  }

  getCi(id: string): Observable<ComunicacaoInterna> {
    const ciDocRef = doc(this.firestore, `cis/${id}`);
    // docData pode retornar `undefined`, então filtramos para garantir o tipo de retorno
    return (docData(ciDocRef, { idField: 'id' }) as Observable<ComunicacaoInterna | undefined>).pipe(
      filter((ci): ci is ComunicacaoInterna => ci !== undefined)
    );
  }

  updateCi(ci: ComunicacaoInterna) {
    const ciDocRef = doc(this.firestore, `cis/${ci.id}`);
    // Remove o id do objeto antes de enviar para o Firestore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = ci;
    return updateDoc(ciDocRef, data);
  }

  deleteCi(id: string) {
    const ciDocRef = doc(this.firestore, `cis/${id}`);
    return deleteDoc(ciDocRef);
  }
}
