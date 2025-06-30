import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FuncionarioService } from '../services/funcionario.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const funcionarioService = inject(FuncionarioService);
  const router = inject(Router);
  const matricula = funcionarioService.getMatriculaLogada();

  if (!matricula) {
    router.navigate(['/login']);
    return of(false);
  }

  return funcionarioService.getFuncionarioByMatricula(matricula).pipe(
    map(funcionario => {
      if (funcionario && funcionario.perfil === 'adm') {
        return true;
      } else {
        router.navigate(['/painel', matricula]);
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/painel', matricula]);
      return of(false);
    })
  );
};
