import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FuncionarioService } from '../services/funcionario.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const funcionarioGuard: CanActivateFn = (route, state) => {
  const funcionarioService = inject(FuncionarioService);
  const router = inject(Router);
  const matricula = funcionarioService.getMatriculaLogada();

  if (!matricula) {
    router.navigate(['/login']);
    return of(false);
  }

  return funcionarioService.getFuncionarioByMatricula(matricula).pipe(
    map(funcionario => {
      if (!funcionario) {
        router.navigate(['/login']);
        return false;
      }

      const url = state.url;
      const userProfile = (funcionario as any).perfil;

      // Rota de Lançamento
      if (url.startsWith('/ci-listar-lancamento')) {
        const allowedProfiles = ['adm', 'lancador', 'apurador'];
        if (userProfile && allowedProfiles.includes(userProfile)) {
          return true;
        }
        router.navigate(['/painel', matricula]);
        return false;
      }

      // Rota de Apuração
      if (url.startsWith('/ci-listar-apuracao')) {
        const allowedProfiles = ['adm', 'apurador', 'lancador'];
        if (userProfile && allowedProfiles.includes(userProfile)) {
          return true;
        }
        router.navigate(['/painel', matricula]);
        return false;
      }

      // Rota de Visualização especializada para apuração/lançamento
      if (url.startsWith('/ci-visualizar-apuracao-lancamento')) {
        const allowedProfiles = ['adm', 'apurador', 'lancador'];
        if (userProfile && allowedProfiles.includes(userProfile)) {
          return true;
        }
        router.navigate(['/painel', matricula]);
        return false;
      }

      // Para todas as outras rotas, permite o acesso se o funcionário for válido
      return true;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
