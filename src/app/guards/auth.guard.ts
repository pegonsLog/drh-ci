import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user$.pipe(
    take(1), // Pega o primeiro valor emitido e completa
    map(user => !!user), // Converte o objeto do usuário para um booleano
    tap(isLoggedIn => {
      if (!isLoggedIn) {
        // Se não estiver logado, redireciona para a página de login
        router.navigate(['/login']);
      }
    })
  );
};
