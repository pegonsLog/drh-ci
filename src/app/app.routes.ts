import { Routes } from '@angular/router';
import { AlterarSenhaComponent } from './componentes/autenticacao/alterar-senha/alterar-senha.component';
import { CiAlterarComponent } from './componentes/consulta/ci/ci-alterar/ci-alterar.component';
import { CiListarComponent } from './componentes/consulta/ci/ci-listar/ci-listar.component';
import { CiNovaComponent } from './componentes/consulta/ci/ci-nova/ci-nova.component';
import { LoginComponent } from './componentes/autenticacao/login/login.component';
import { PainelComponent } from './componentes/painel/painel.component';
import { funcionarioGuard } from './guards/funcionario.guard';
import { adminGuard } from './guards/admin.guard';
import { FuncionarioListarComponent } from './componentes/autenticacao/funcionario/funcionario-listar/funcionario-listar.component';
import { FuncionarioNovoComponent } from './componentes/autenticacao/funcionario/funcionario-novo/funcionario-novo.component';
import { FuncionarioAlterarComponent } from './componentes/autenticacao/funcionario/funcionario-alterar/funcionario-alterar.component';
import { CiVisualizarComponent } from './componentes/consulta/ci/ci-visualizar/ci-visualizar.component';
import { EscalaListarComponent } from './componentes/consulta/escala/escala-listar/escala-listar.component';
import { EscalaNovaComponent } from './componentes/consulta/escala/escala-nova/escala-nova.component';
import { EscalaAlterarComponent } from './componentes/consulta/escala/escala-alterar/escala-alterar.component';

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
    { path: 'funcionario-listar/:matricula', component: FuncionarioListarComponent, canActivate: [adminGuard] },
    { path: 'funcionario-novo/:matricula', component: FuncionarioNovoComponent, canActivate: [adminGuard] },
    { path: 'funcionario-alterar/:matricula/:id', component: FuncionarioAlterarComponent, canActivate: [adminGuard] },
    { path: 'escala-listar', component: EscalaListarComponent, canActivate: [funcionarioGuard] },
    { path: 'escala-nova', component: EscalaNovaComponent, canActivate: [adminGuard] },
    { path: 'escala-alterar/:id', component: EscalaAlterarComponent, canActivate: [adminGuard] }
];
