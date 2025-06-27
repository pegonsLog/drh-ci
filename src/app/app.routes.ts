import { Routes } from '@angular/router';
import { AlterarSenhaComponent } from './componentes/alterar-senha/alterar-senha.component';
import { CiAlterarComponent } from './componentes/ci-alterar/ci-alterar.component';
import { CiListarComponent } from './componentes/ci-listar/ci-listar.component';
import { CiNovaComponent } from './componentes/ci-nova/ci-nova.component';
import { LoginComponent } from './componentes/login/login.component';
import { PainelComponent } from './componentes/painel/painel.component';
import { funcionarioGuard } from './guards/funcionario.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'alterar-senha', component: AlterarSenhaComponent },
    {
        path: 'painel/:matricula',
        component: PainelComponent,
        canActivate: [funcionarioGuard]
    },
    { path: 'ci-nova', component: CiNovaComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-alterar/:id', component: CiAlterarComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-listar', component: CiListarComponent, canActivate: [funcionarioGuard] }
];
