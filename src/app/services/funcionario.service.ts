import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, deleteDoc, orderBy } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { BehaviorSubject, forkJoin, from, Observable, of } from 'rxjs';

export interface Funcionario {
  id?: string;
  funcionario: string;
  matricula: string;
  perfil: string;
  email?: string;
  senha?: string;
  assinaturaDigitalUrl?: string;

}
import { map, switchMap, catchError } from 'rxjs/operators';
import * as bcrypt from 'bcryptjs';

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {
  private perfilUsuario = new BehaviorSubject<string | null>(sessionStorage.getItem('perfil'));
  perfilUsuario$ = this.perfilUsuario.asObservable();

  constructor(private firestore: Firestore, private storage: Storage) { }

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

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const hashedPassword = userData['senha'];

        if (!hashedPassword || typeof hashedPassword !== 'string') {
          return { success: false };
        }

        // Tenta autenticar com a senha criptografada (padrão)
        // DEBUG: Log para ver a senha armazenada


        // 1. Tenta autenticar com a senha criptografada (padrão)
        try {
          const isAuth = bcrypt.compareSync(senha, hashedPassword);
          if (isAuth) {

            const perfil = userData['perfil'] || 'user';
            sessionStorage.setItem('matricula', matricula);
            sessionStorage.setItem('perfil', perfil);
            this.perfilUsuario.next(perfil);
            return { success: true, matricula: matricula };
          }
        } catch (e) {
            console.warn('[AUTH] Erro ao comparar hash. Provavelmente a senha armazenada não é um hash válido.', e);
        }

        // 2. LÓGICA DE MIGRAÇÃO: Se a autenticação falhar, verifica se a senha é texto plano
        if (hashedPassword === senha) {
          console.warn(`[MIGRAÇÃO] Senha em texto plano detectada para o usuário ${matricula}. Atualizando para hash.`);
          try {
            const salt = bcrypt.genSaltSync(10);
            const newHashedPassword = bcrypt.hashSync(senha, salt);
            const userDocRef = doc(this.firestore, 'funcionarios', userDoc.id);
            updateDoc(userDocRef, { senha: newHashedPassword }); // Atualiza em background


            const perfil = userData['perfil'] || 'user';
            sessionStorage.setItem('matricula', matricula);
            sessionStorage.setItem('perfil', perfil);
            this.perfilUsuario.next(perfil);
            return { success: true, matricula: matricula };
          } catch (e) {
            console.error('[MIGRAÇÃO] Falha ao tentar criar hash e atualizar a senha.', e);
            return { success: false }; // Impede o login se a migração falhar
          }
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

  addFuncionario(funcionario: Funcionario): Observable<string | null> {
    // 1. Valida a matrícula e converte para número
    const matriculaAsNumber = parseInt(funcionario.matricula as any, 10);
    if (isNaN(matriculaAsNumber)) {
      console.error('Erro: Matrícula inválida, não pode ser convertida para número.');
      return of(null);
    }

    // 2. Valida a senha (obrigatória para novos funcionários)
    const senha = funcionario.senha;
    if (!senha) {
      console.error('Erro: Senha não fornecida para o novo funcionário.');
      return of(null);
    }

    // 3. Criptografa a senha
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(senha, salt);

    // 4. Monta o objeto final com dados validados e tipados corretamente
    const dataToSave = {
      ...funcionario,
      matricula: matriculaAsNumber,
      senha: hashedPassword,
    };

    // 5. Salva no Firestore
    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');
    return from(addDoc(funcionariosCollectionRef, dataToSave)).pipe(
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Erro ao adicionar funcionário:', error);
        return of(null);
      })
    );
  }

  updateFuncionario(id: string, funcionarioData: Partial<Funcionario>): Observable<boolean> {
    const funcionarioDocRef = doc(this.firestore, 'funcionarios', id);

    const dataToUpdate: Partial<Funcionario> = { ...funcionarioData };

    // Se uma nova senha foi fornecida, faz o hash. Senão, remove o campo para não sobrescrever.
    if (dataToUpdate.senha) {
      const salt = bcrypt.genSaltSync(10);
      dataToUpdate.senha = bcrypt.hashSync(dataToUpdate.senha, salt);
    } else {
      delete dataToUpdate.senha; // Garante que a senha não seja alterada para um valor vazio
    }

    return from(updateDoc(funcionarioDocRef, dataToUpdate)).pipe(
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

  getAssinaturaUrl(matricula: string): Observable<string | null> {
    return this.getFuncionarioByMatricula(matricula).pipe(
      map(funcionario => funcionario?.assinaturaDigitalUrl || null)
    );
  }

  uploadAssinatura(funcionarioId: string, file: File): Observable<string | null> {
    const filePath = `assinaturas/${funcionarioId}_${new Date().getTime()}`;
    const storageRef = ref(this.storage, filePath);

    return from(uploadBytes(storageRef, file)).pipe(
      switchMap(uploadResult => from(getDownloadURL(uploadResult.ref))),
      catchError(error => {
        console.error('Erro ao fazer upload da assinatura:', error);
        return of(null);
      })
    );
  }

  alterarSenha(matricula: string, senhaAtual: string, novaSenha: string): Observable<boolean> {
    const funcionariosCollectionRef = collection(this.firestore, 'funcionarios');

    // Busca por matrícula como string
    const stringSearch$ = from(getDocs(query(funcionariosCollectionRef, where('matricula', '==', matricula))));

    // Busca por matrícula como número
    const matriculaAsNumber = parseInt(matricula, 10);
    const numberSearch$ = !isNaN(matriculaAsNumber)
      ? from(getDocs(query(funcionariosCollectionRef, where('matricula', '==', matriculaAsNumber))))
      : of(null);

    return forkJoin([stringSearch$, numberSearch$]).pipe(
      switchMap(([stringSnapshot, numberSnapshot]) => {
        const querySnapshot = stringSnapshot?.size === 1 ? stringSnapshot : numberSnapshot;

        if (!querySnapshot || querySnapshot.empty) {
          console.error('[ALTERAR SENHA] Matrícula não encontrada:', matricula);
          return of(false);
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const hashedPassword = userData['senha'];

        // 1. Validar a senha atual
        const isSenhaAtualValida = bcrypt.compareSync(senhaAtual, hashedPassword);

        if (!isSenhaAtualValida) {
          console.warn('[ALTERAR SENHA] Tentativa de alteração com senha atual incorreta para a matrícula:', matricula);
          return of(false); // Senha atual não confere
        }

        // 2. Se a senha atual for válida, prosseguir com a alteração
        const userDocRef = doc(this.firestore, 'funcionarios', userDoc.id);
        const salt = bcrypt.genSaltSync(10);
        const newHashedPassword = bcrypt.hashSync(novaSenha, salt);

        return from(updateDoc(userDocRef, { senha: newHashedPassword })).pipe(
          map(() => true)
        );
      }),
      catchError(error => {
        console.error('Erro ao alterar senha:', error);
        return of(false);
      })
    );
  }


}
