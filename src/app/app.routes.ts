import { Routes } from '@angular/router';
import { AlterarSenhaComponent } from './componentes/autenticacao/alterar-senha/alterar-senha.component';
import { FuncionarioAlterarComponent } from './componentes/autenticacao/funcionario/funcionario-alterar/funcionario-alterar.component';
import { FuncionarioListarComponent } from './componentes/autenticacao/funcionario/funcionario-listar/funcionario-listar.component';
import { FuncionarioNovoComponent } from './componentes/autenticacao/funcionario/funcionario-novo/funcionario-novo.component';
import { LoginComponent } from './componentes/autenticacao/login/login.component';
import { CiAlterarComponent } from './componentes/consulta/ci/ci-alterar/ci-alterar.component';
import { CiListarComponent } from './componentes/consulta/ci/ci-listar/ci-listar.component';
import { CiNovaComponent } from './componentes/consulta/ci/ci-nova/ci-nova.component';
import { CiVisualizarComponent } from './componentes/consulta/ci/ci-visualizar/ci-visualizar.component';
import { EscalaAlterarComponent } from './componentes/consulta/escala/escala-alterar/escala-alterar.component';
import { EscalaListarComponent } from './componentes/consulta/escala/escala-listar/escala-listar.component';
import { EscalaNovaComponent } from './componentes/consulta/escala/escala-nova/escala-nova.component';
import { PainelComponent } from './componentes/painel/painel.component';
import { adminGuard } from './guards/admin.guard';
import { funcionarioGuard } from './guards/funcionario.guard';
import { CiAlterarAprovacaoComponent } from './componentes/consulta/ci/ci-alterar-aprovacao/ci-alterar-aprovacao.component';
import { CiListarAprovacaoComponent } from './componentes/consulta/ci/ci-listar-aprovacao/ci-listar-aprovacao.component';

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
    { path: 'ci-alterar-aprovacao/:matricula/:id', component: CiAlterarAprovacaoComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-listar-aprovacao/:matricula', component: CiListarAprovacaoComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-visualizar/:matricula/:id', component: CiVisualizarComponent, canActivate: [funcionarioGuard] },
    { path: 'funcionario-listar/:matricula', component: FuncionarioListarComponent, canActivate: [adminGuard] },
    { path: 'funcionario-novo/:matricula', component: FuncionarioNovoComponent, canActivate: [adminGuard] },
    { path: 'funcionario-alterar/:matricula/:id', component: FuncionarioAlterarComponent, canActivate: [adminGuard] },
    { path: 'escala-listar', component: EscalaListarComponent, canActivate: [funcionarioGuard] },
    { path: 'escala-nova', component: EscalaNovaComponent, canActivate: [adminGuard] },
    { path: 'escala-alterar/:id', component: EscalaAlterarComponent, canActivate: [adminGuard] }
];
