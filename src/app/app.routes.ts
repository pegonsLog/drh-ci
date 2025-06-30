import { Routes } from '@angular/router';
import { AlterarSenhaComponent } from './componentes/alterar-senha/alterar-senha.component';
import { CiAlterarComponent } from './componentes/ci-alterar/ci-alterar.component';
import { CiListarComponent } from './componentes/ci-listar/ci-listar.component';
import { CiNovaComponent } from './componentes/ci-nova/ci-nova.component';
import { LoginComponent } from './componentes/login/login.component';
import { PainelComponent } from './componentes/painel/painel.component';
import { funcionarioGuard } from './guards/funcionario.guard';
import { adminGuard } from './guards/admin.guard';
import { FuncionarioListarComponent } from './componentes/funcionario-listar/funcionario-listar.component';
import { FuncionarioNovoComponent } from './componentes/funcionario-novo/funcionario-novo.component';
import { FuncionarioAlterarComponent } from './componentes/funcionario-alterar/funcionario-alterar.component';
import { CiVisualizarComponent } from './componentes/ci-visualizar/ci-visualizar.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'alterar-senha', component: AlterarSenhaComponent },
    {
        path: 'painel/:matricula',
        component: PainelComponent,
        canActivate: [funcionarioGuard]
    },
    { path: 'ci-nova/:matricula', component: CiNovaComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-alterar/:matricula/:id', component: CiAlterarComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-listar/:matricula', component: CiListarComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-visualizar/:matricula/:id', component: CiVisualizarComponent, canActivate: [funcionarioGuard] },
    { path: 'funcionario-listar/:matricula', component: FuncionarioListarComponent, canActivate: [funcionarioGuard] },
    { path: 'funcionario-novo/:matricula', component: FuncionarioNovoComponent, canActivate: [adminGuard] },
    { path: 'funcionario-alterar/:matricula/:id', component: FuncionarioAlterarComponent, canActivate: [adminGuard] }
];
