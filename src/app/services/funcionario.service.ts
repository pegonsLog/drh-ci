import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';

export interface Funcionario {
  id?: string;
  funcionario: string;
  matricula: number;
}
import { map, switchMap, catchError } from 'rxjs/operators';
import * as bcrypt from 'bcryptjs';

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {

  constructor(private firestore: Firestore) { }

  login(matricula: string, senha: string): Observable<{ success: boolean, matricula?: string }> {
    const matriculaAsNumber = parseInt(matricula, 10);
    if (isNaN(matriculaAsNumber)) {
      return of({ success: false });
    }

    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');
    const q = query(funcionariosCollectionRef, where('matricula', '==', matriculaAsNumber));

    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        if (querySnapshot.size !== 1) {
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
  }

  getMatriculaLogada(): string | null {
    return sessionStorage.getItem('matricula');
  }

  getFuncionarioByMatricula(matricula: string): Observable<Funcionario | null> {
    const matriculaAsNumber = parseInt(matricula, 10);
    if (isNaN(matriculaAsNumber)) {
      return of(null);
    }

    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');
    const q = query(funcionariosCollectionRef, where('matricula', '==', matriculaAsNumber));

    return from(getDocs(q)).pipe(
      map(querySnapshot => {
        if (querySnapshot.empty) {
          return null;
        }
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Funcionario;
      }),
      catchError(error => {
        console.error('Erro ao buscar dados do funcionário:', error);
        return of(null);
      })
    );
  }

  verificarMatricula(matricula: string): Observable<boolean> {
    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');
    const matriculaAsNumber = parseInt(matricula, 10);
    if (isNaN(matriculaAsNumber)) {
      return of(false);
    }
    const q = query(funcionariosCollectionRef, where('matricula', '==', matriculaAsNumber));
    return from(getDocs(q)).pipe(
      map(querySnapshot => !querySnapshot.empty)
    );
  }

  alterarSenha(matricula: string, novaSenha: string): Observable<boolean> {
    const matriculaAsNumber = parseInt(matricula, 10);
    if (isNaN(matriculaAsNumber)) {
      return of(false);
    }

    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');
    const q = query(funcionariosCollectionRef, where('matricula', '==', matriculaAsNumber));

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
