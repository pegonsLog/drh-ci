import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, deleteDoc, orderBy } from '@angular/fire/firestore';
import { BehaviorSubject, forkJoin, from, Observable, of } from 'rxjs';

export interface Funcionario {
  id?: string;
  funcionario: string;
  matricula: string;
  perfil: string;
  senha?: string; // Senha é opcional aqui, pois não queremos retorná-la sempre
}
import { map, switchMap, catchError } from 'rxjs/operators';
import * as bcrypt from 'bcryptjs';

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {
  private perfilUsuario = new BehaviorSubject<string | null>(sessionStorage.getItem('perfil'));
  perfilUsuario$ = this.perfilUsuario.asObservable();

  constructor(private firestore: Firestore) { }

  login(matricula: string, senha: string): Observable<{ success: boolean, matricula?: string }> {
    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');

    // Busca por matrícula como string
    const qString = query(funcionariosCollectionRef, where('matricula', '==', matricula));
    const stringSearch$ = from(getDocs(qString));

    // Busca por matrícula como número
    const matriculaAsNumber = parseInt(matricula, 10);
    const numberSearch$ = !isNaN(matriculaAsNumber)
      ? from(getDocs(query(funcionariosCollectionRef, where('matricula', '==', matriculaAsNumber))))
      : of(null);

    return forkJoin([stringSearch$, numberSearch$]).pipe(
      map(([stringSnapshot, numberSnapshot]) => {
        const querySnapshot = stringSnapshot?.size === 1 ? stringSnapshot : numberSnapshot;

        if (!querySnapshot || querySnapshot.size !== 1) {
          return { success: false };
        }

        const userDoc = querySnapshot.docs[0].data();
        const hashedPassword = userDoc['senha'];

        if (!hashedPassword || typeof hashedPassword !== 'string') {
          return { success: false };
        }

        const isAuth = bcrypt.compareSync(senha, hashedPassword);
        if (isAuth) {
          sessionStorage.setItem('matricula', matricula);
          return { success: true, matricula: matricula };
        }
        return { success: false };
      }),
      catchError(error => {
        console.error('Erro ao autenticar funcionário:', error);
        return of({ success: false });
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('matricula');
    sessionStorage.removeItem('perfil');
    this.perfilUsuario.next(null);
  }

  setPerfil(perfil: string | null): void {
    if (perfil) {
      sessionStorage.setItem('perfil', perfil);
    } else {
      sessionStorage.removeItem('perfil');
    }
    this.perfilUsuario.next(perfil);
  }

  getMatriculaLogada(): string | null {
    return sessionStorage.getItem('matricula');
  }

    getFuncionarioByMatricula(matricula: string): Observable<Funcionario | null> {
    if (!matricula) {
      return of(null);
    }

    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');

    // Tenta buscar tanto como string quanto como número para lidar com inconsistências de dados.
    const qString = query(funcionariosCollectionRef, where('matricula', '==', matricula));
    const stringSearch$ = from(getDocs(qString));

    const matriculaAsNumber = parseInt(matricula, 10);
    const numberSearch$ = !isNaN(matriculaAsNumber)
      ? from(getDocs(query(funcionariosCollectionRef, where('matricula', '==', matriculaAsNumber))))
      : of(null);

    return forkJoin([stringSearch$, numberSearch$]).pipe(
      map(([stringSnapshot, numberSnapshot]) => {
        if (stringSnapshot && !stringSnapshot.empty) {
          const doc = stringSnapshot.docs[0];
          return { id: doc.id, ...doc.data() } as Funcionario;
        }
        if (numberSnapshot && !numberSnapshot.empty) {
          const doc = numberSnapshot.docs[0];
          return { id: doc.id, ...doc.data() } as Funcionario;
        }
        return null;
      }),
      catchError(error => {
        console.error('Erro ao buscar funcionário por matrícula (string/número):', error);
        return of(null);
      })
    );
  }

  verificarMatricula(matricula: string): Observable<boolean> {
    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');
    const q = query(funcionariosCollectionRef, where('matricula', '==', matricula));
    return from(getDocs(q)).pipe(
      map(querySnapshot => !querySnapshot.empty)
    );
  }

  getFuncionarios(): Observable<Funcionario[]> {
    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');
    const q = query(funcionariosCollectionRef, orderBy('funcionario'));
    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Funcionario));
      }),
      catchError(error => {
        console.error('Erro ao buscar funcionários:', error);
        return of([]);
      })
    );
  }

  getFuncionarioById(id: string): Observable<Funcionario | null> {
    const funcionarioDocRef = doc(this.firestore, 'funcionarios', id);
    return from(getDoc(funcionarioDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Funcionario;
        } else {
          return null;
        }
      }),
      catchError(error => {
        console.error('Erro ao buscar funcionário por ID:', error);
        return of(null);
      })
    );
  }

  addFuncionario(funcionario: Omit<Funcionario, 'id'>): Observable<string | null> {
    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');
    // Hash da senha antes de salvar
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync((funcionario as any).senha, salt);
    const funcionarioComSenhaHasheada = { ...funcionario, senha: hashedPassword };

    return from(addDoc(funcionariosCollectionRef, funcionarioComSenhaHasheada)).pipe(
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Erro ao adicionar funcionário:', error);
        return of(null);
      })
    );
  }

  updateFuncionario(id: string, funcionario: Partial<Funcionario>): Observable<boolean> {
    const funcionarioDocRef = doc(this.firestore, 'funcionarios', id);
    return from(updateDoc(funcionarioDocRef, funcionario)).pipe(
      map(() => true),
      catchError(error => {
        console.error('Erro ao atualizar funcionário:', error);
        return of(false);
      })
    );
  }

  deleteFuncionario(id: string): Observable<boolean> {
    const funcionarioDocRef = doc(this.firestore, 'funcionarios', id);
    return from(deleteDoc(funcionarioDocRef)).pipe(
      map(() => true),
      catchError(error => {
        console.error('Erro ao excluir funcionário:', error);
        return of(false);
      })
    );
  }

  alterarSenha(matricula: string, novaSenha: string): Observable<boolean> {
    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');
    const q = query(funcionariosCollectionRef, where('matricula', '==', matricula));

    return from(getDocs(q)).pipe(
      switchMap(querySnapshot => {
        if (querySnapshot.size === 1) {
          const userDoc = querySnapshot.docs[0];
          const userDocRef = doc(this.firestore, 'funcionarios', userDoc.id);
          const salt = bcrypt.genSaltSync(10);
          const hashedPassword = bcrypt.hashSync(novaSenha, salt);
          return from(updateDoc(userDocRef, { senha: hashedPassword })).pipe(
            map(() => true)
          );
        } else {
          return of(false);
        }
      }),
      catchError(error => {
        console.error('Erro ao alterar senha:', error);
        return of(false);
      })
    );
  }
}
