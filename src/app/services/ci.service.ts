import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, docData, query, where, orderBy, CollectionReference, DocumentData, DocumentSnapshot, QueryConstraint, endBefore, getDocs, limit, limitToLast, startAfter } from '@angular/fire/firestore';
import { Observable, filter, map, from, of, forkJoin, switchMap } from 'rxjs';

// Interface para CIs que ainda não foram salvas (sem id)
export interface NewComunicacaoInterna {
  de: string;
  para: string;
  data: any;
  comunicacao: string;
  matricula: string;
  destinatario_matricula?: string;
  'destinatario_matricula-cc'?: string;
  aprovacaoStatus: 'aprovado' | 'nao_aprovado' | 'pendente';
  dataAprovacao?: any;
  lancamentoStatus: 'nao_lancado' | 'lancado';
  dataLancamento?: any;
  lancador_matricula?: string;
  aprovacao_gerente?:  'aprovado' | 'nao_aprovado' | 'pendente';
  data_aprovacao_gerente?: any;
  gerente_aprovador_matricula?: string;
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



  // Este método foi simplificado para buscar TODAS as CIs para aprovação sem paginação no lado do serviço.
  // A paginação será tratada no componente.
  getCisParaAprovacao(matricula: string): Observable<ComunicacaoInterna[]> {
    const cisCollection = collection(this.firestore, 'cis');

    // Query para CIs onde o usuário é o destinatário principal
    const query1 = query(cisCollection,
      where('destinatario_matricula', '==', matricula)
    );

    // Query para CIs onde o usuário é o destinatário em cópia
    const query2 = query(cisCollection,
      where('destinatario_matricula-cc', '==', matricula)
    );

    const promise1 = getDocs(query1);
    const promise2 = getDocs(query2);

    return from(Promise.all([promise1, promise2])).pipe(
      map(([snapshot1, snapshot2]) => {
        const ciMap = new Map<string, ComunicacaoInterna>();

        snapshot1.docs.forEach(doc => {
          const data = doc.data() as ComunicacaoInterna;
          ciMap.set(doc.id, { ...data, id: doc.id });
        });

        snapshot2.docs.forEach(doc => {
          const data = doc.data() as ComunicacaoInterna;
          ciMap.set(doc.id, { ...data, id: doc.id });
        });

        let combinedCis = Array.from(ciMap.values());
        
        combinedCis.sort((a, b) => {
          const timeA = a.data?.toMillis ? a.data.toMillis() : 0;
          const timeB = b.data?.toMillis ? b.data.toMillis() : 0;
          return timeB - timeA; // Ordena por data descendente
        });

        return combinedCis;
      })
    );
  }

  getAllCisParaAprovacao(): Observable<ComunicacaoInterna[]> {
    const cisCollection = collection(this.firestore, 'cis');
    const q = query(cisCollection, orderBy('data', 'desc'));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ComunicacaoInterna));
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

  updateAprovacaoStatus(id: string, status: 'aprovado' | 'nao_aprovado' | 'pendente', dataAprovacao?: any) {
    const ciDocRef = doc(this.firestore, `cis/${id}`);
    const dataToUpdate: any = { aprovacaoStatus: status };

    if (dataAprovacao) {
      dataToUpdate.dataAprovacao = dataAprovacao;
    }

    return updateDoc(ciDocRef, dataToUpdate);
  }

  updateLancamentoStatus(id: string, status: 'lancado' | 'nao_lancado', dataLancamento?: any, lancadorMatricula?: string) {
    const ciDocRef = doc(this.firestore, `cis/${id}`);
    const dataToUpdate: any = { lancamentoStatus: status };

    if (dataLancamento) {
      dataToUpdate.dataLancamento = dataLancamento;
    }

    if (lancadorMatricula) {
      dataToUpdate.lancador_matricula = lancadorMatricula;
    }

    return updateDoc(ciDocRef, dataToUpdate);
  }

  updateAprovacaoGerenteStatus(id: string, status: 'aprovado' | 'nao_aprovado' | 'pendente', dataAprovacaoGerente?: any, gerenteMatricula?: string) {
    const ciDocRef = doc(this.firestore, `cis/${id}`);
    const dataToUpdate: any = { aprovacao_gerente: status };

    if (dataAprovacaoGerente) {
      dataToUpdate.data_aprovacao_gerente = dataAprovacaoGerente;
    }

    if (gerenteMatricula) {
      dataToUpdate.gerente_aprovador_matricula = gerenteMatricula;
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

  getCisParaAprovacaoPaginado(
    matricula: string,
    isAdm: boolean,
    pageSize: number,
    direction: 'next' | 'prev',
    cursor?: DocumentSnapshot<DocumentData>
  ): Observable<PaginatedCisResult> {
    const cisCollection = collection(this.firestore, 'cis');
    let constraints: QueryConstraint[] = [];

    if (!isAdm) {
      // Firestore não suporta queries 'OR' em campos diferentes ('destinatario_matricula' e 'destinatario_matricula-cc').
      // A abordagem aqui é buscar por destinatário principal. A paginação em 'cc' exigiria uma estrutura de dados diferente.
      constraints.push(where('destinatario_matricula', '==', matricula));
    }

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
