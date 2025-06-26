import { Injectable } from '@angular/core';
import { Auth, signOut, user, User, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Observable para que outros componentes possam se inscrever e saber o estado do usuário
  public readonly user$: Observable<User | null>;

  constructor(private auth: Auth) {
    this.user$ = user(this.auth);
  }

  /**
   * Realiza o login do usuário com a conta do Google.
   * @returns Um Observable com o resultado da autenticação.
   */
  loginWithGoogle(): Observable<any> {
    return from(signInWithPopup(this.auth, new GoogleAuthProvider()));
  }

  /**
   * Realiza o logout do usuário atual.
   * @returns Um Observable que completa quando o logout é finalizado.
   */
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }
}
