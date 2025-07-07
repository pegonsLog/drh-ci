import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, docData, query, where, orderBy, CollectionReference, DocumentData, DocumentSnapshot, QueryConstraint, endBefore, getDocs, limit, limitToLast, startAfter } from '@angular/fire/firestore';
import { Observable, filter, map, from, of } from 'rxjs';

// Interface para CIs que ainda não foram salvas (sem id)
export interface NewComunicacaoInterna {
  de: string;
  para: string;
  data: any;
  comunicacao: string;
  matricula: string;
  destinatario_matricula?: string;
  aprovacaoStatus: 'aprovado' | 'reprovado' | 'pendente';
  dataAprovacao?: any;
  lancamentoStatus: 'nao_lancado' | 'lancado';
  dataLancamento?: any;
}

// Interface para CIs que vêm do banco (com id obrigatório)
export interface ComunicacaoInterna extends NewComunicacaoInterna {
  id: string;
}

export interface PaginatedCisResult {
  cis: ComunicacaoInterna[];
  lastDoc: DocumentSnapshot<DocumentData> | null;
  firstDoc: DocumentSnapshot<DocumentData> | null;
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
    // Mantido para compatibilidade, busca todos os resultados (limite alto).
    return this.getCisPorUsuarioPaginado(matricula, 1000, 'next').pipe(
      map(result => result.cis)
    );
  }

  getCisPorUsuarioPaginado(matricula: string, pageSize: number, direction: 'next' | 'prev', cursor?: DocumentSnapshot<DocumentData>): Observable<{ cis: ComunicacaoInterna[], firstDoc: DocumentSnapshot<DocumentData> | null, lastDoc: DocumentSnapshot<DocumentData> | null }> {
    const cisCollection = collection(this.firestore, 'cis');
    const constraints = [ where('matricula', '==', matricula) ];

    let q;
    if (direction === 'prev' && cursor) {
      q = query(
        cisCollection,
        ...constraints,
        orderBy('data', 'asc'),
        endBefore(cursor),
        limitToLast(pageSize)
      );
    } else {
      q = query(
        cisCollection,
        ...constraints,
        orderBy('data', 'desc'),
        limit(pageSize)
      );
      if (cursor && direction === 'next') {
        q = query(q, startAfter(cursor));
      }
    }

    return from(getDocs(q)).pipe(
      map(snapshot => {
        let cis = snapshot.docs.map(doc => {
          const data = doc.data() as ComunicacaoInterna;
          return { ...data, id: doc.id };
        });

        if (direction === 'prev') {
          cis.reverse();
        }

        const firstDoc = snapshot.docs.length > 0 ? snapshot.docs[0] : null;
        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

        return { cis, firstDoc, lastDoc };
      })
    );
  }

  getCisParaAprovacao(matricula: string): Observable<ComunicacaoInterna[]> {
    // Este método agora usa a função paginada para manter a compatibilidade, 
    // mas busca todos os resultados (limite alto) para quem o usa sem paginação.
    return this.getCisParaAprovacaoPaginado(matricula, 1000, 'next').pipe(
      map(result => result.cis)
    );
  }

  getCisParaAprovacaoPaginado(
    matricula: string,
    pageSize: number,
    direction: 'next' | 'prev',
    cursor?: DocumentSnapshot<DocumentData>
  ): Observable<{ cis: ComunicacaoInterna[], firstDoc: DocumentSnapshot<DocumentData> | null, lastDoc: DocumentSnapshot<DocumentData> | null }> {
    const cisCollection = collection(this.firestore, 'cis');
    const constraints: QueryConstraint[] = [
      where('para', '==', matricula)
      // Nenhum outro filtro de status para mostrar todos os registros do aprovador
    ];

    let q;
    if (direction === 'prev' && cursor) {
      q = query(
        cisCollection,
        ...constraints,
        orderBy('data', 'asc'),
        endBefore(cursor),
        limitToLast(pageSize)
      );
    } else {
      q = query(
        cisCollection,
        ...constraints,
        orderBy('data', 'desc'),
        limit(pageSize)
      );
      if (cursor && direction === 'next') {
        q = query(q, startAfter(cursor));
      }
    }

    return from(getDocs(q)).pipe(
      map(snapshot => {
        let cis = snapshot.docs.map(doc => {
          const data = doc.data() as ComunicacaoInterna;
          return { ...data, id: doc.id };
        });

        if (direction === 'prev') {
          cis.reverse();
        }

        const firstDoc = snapshot.docs.length > 0 ? snapshot.docs[0] : null;
        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

        return { cis, firstDoc, lastDoc };
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

  updateAprovacaoStatus(id: string, status: 'aprovado' | 'reprovado' | 'pendente', dataAprovacao?: any) {
    const ciDocRef = doc(this.firestore, `cis/${id}`);
    const dataToUpdate: any = { aprovacaoStatus: status };

    if (dataAprovacao) {
      dataToUpdate.dataAprovacao = dataAprovacao;
    }

    // Se a CI for aprovada, define o status de lançamento como 'nao_lancado'
    if (status === 'aprovado') {
      dataToUpdate.lancamentoStatus = 'nao_lancado';
    }

    return updateDoc(ciDocRef, dataToUpdate);
  }

  updateLancamentoStatus(id: string, status: 'lancado' | 'nao_lancado', dataLancamento?: any) {
    const ciDocRef = doc(this.firestore, `cis/${id}`);
    const dataToUpdate: any = { lancamentoStatus: status };

    if (dataLancamento) {
      dataToUpdate.dataLancamento = dataLancamento;
    }

    return updateDoc(ciDocRef, dataToUpdate);
  }

  getCisParaLancamento(): Observable<ComunicacaoInterna[]> {
    return this.getCisParaLancamentoPaginado(1000, 'next').pipe(
      map(result => result.cis)
    );
  }

  getCisParaLancamentoPaginado(
    pageSize: number,
    direction: 'next' | 'prev',
    cursor?: DocumentSnapshot<DocumentData>
  ): Observable<{ cis: ComunicacaoInterna[], firstDoc: DocumentSnapshot<DocumentData> | null, lastDoc: DocumentSnapshot<DocumentData> | null }> {
    const cisCollection = collection(this.firestore, 'cis');
    const constraints: QueryConstraint[] = [
      // Nenhum filtro aplicado para mostrar todos os registros
    ];

    let q;
    if (direction === 'prev' && cursor) {
      q = query(
        cisCollection,
        ...constraints,
        orderBy('data', 'asc'),
        endBefore(cursor),
        limitToLast(pageSize)
      );
    } else {
      // Handles 'next' and the initial load
      q = query(
        cisCollection,
        ...constraints,
        orderBy('data', 'desc'),
        limit(pageSize)
      );
      if (cursor && direction === 'next') {
        q = query(q, startAfter(cursor));
      }
    }

    return from(getDocs(q)).pipe(
      map(snapshot => {
        let cis = snapshot.docs.map(doc => {
          const data = doc.data() as ComunicacaoInterna;
          return { ...data, id: doc.id };
        });

        if (direction === 'prev') {
          cis.reverse();
        }

        const firstDoc = snapshot.docs.length > 0 ? snapshot.docs[0] : null;
        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

        return { cis, firstDoc, lastDoc };
      })
    );
  }

  getCisParaApuracao(): Observable<ComunicacaoInterna[]> {
    return this.getCisParaApuracaoPaginado(1000, 'next').pipe(
      map(result => result.cis)
    );
  }

  getCisParaApuracaoPaginado(
    pageSize: number,
    direction: 'next' | 'prev',
    cursor?: DocumentSnapshot<DocumentData>
  ): Observable<{ cis: ComunicacaoInterna[], firstDoc: DocumentSnapshot<DocumentData> | null, lastDoc: DocumentSnapshot<DocumentData> | null }> {
    const cisCollection = collection(this.firestore, 'cis');
    const constraints: QueryConstraint[] = [
      // Nenhum filtro aplicado para mostrar todos os registros
    ];

    let q;
    if (direction === 'prev' && cursor) {
      q = query(
        cisCollection,
        ...constraints,
        orderBy('data', 'asc'),
        endBefore(cursor),
        limitToLast(pageSize)
      );
    } else {
      // Handles 'next' and the initial load
      q = query(
        cisCollection,
        ...constraints,
        orderBy('data', 'desc'),
        limit(pageSize)
      );
      if (cursor && direction === 'next') {
        q = query(q, startAfter(cursor));
      }
    }

    return from(getDocs(q)).pipe(
      map(snapshot => {
        let cis = snapshot.docs.map(doc => {
          const data = doc.data() as ComunicacaoInterna;
          return { ...data, id: doc.id };
        });

        if (direction === 'prev') {
          cis.reverse();
        }

        const firstDoc = snapshot.docs.length > 0 ? snapshot.docs[0] : null;
        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

        return { cis, firstDoc, lastDoc };
      })
    );
  }
}
