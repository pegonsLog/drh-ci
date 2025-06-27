import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FuncionarioService } from '../services/funcionario.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const funcionarioGuard: CanActivateFn = (route, state) => {
  const funcionarioService = inject(FuncionarioService);
  const router = inject(Router);

  const matriculaLogada = funcionarioService.getMatriculaLogada();

  if (matriculaLogada) {
    return true; // Usuário está logado, permite o acesso
  }

  // Usuário não está logado, redireciona para o login
  router.navigate(['/login']);
  return false;
};
