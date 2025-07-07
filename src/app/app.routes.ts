import { Routes } from '@angular/router';
import { AlterarSenhaComponent } from './componentes/autenticacao/alterar-senha/alterar-senha.component';
import { FuncionarioAlterarComponent } from './componentes/autenticacao/funcionario/funcionario-alterar/funcionario-alterar.component';
import { FuncionarioListarComponent } from './componentes/autenticacao/funcionario/funcionario-listar/funcionario-listar.component';
import { FuncionarioNovoComponent } from './componentes/autenticacao/funcionario/funcionario-novo/funcionario-novo.component';
import { LoginComponent } from './componentes/autenticacao/login/login.component';
import { CiAlterarAprovacaoComponent } from './componentes/consulta/ci/ci-aprovacao/ci-alterar-aprovacao/ci-alterar-aprovacao.component';
import { CiListarAprovacaoComponent } from './componentes/consulta/ci/ci-aprovacao/ci-listar-aprovacao/ci-listar-aprovacao.component';
import { CiVisualizarAprovacaoComponent } from './componentes/consulta/ci/ci-aprovacao/ci-visualizar-aprovacao/ci-visualizar-aprovacao.component';
import { CiListarApuracaoComponent } from './componentes/consulta/ci/ci-apurador/ci-listar-apuracao/ci-listar-apuracao.component';
import { CiVisualizarApuracaoComponent } from './componentes/consulta/ci/ci-apurador/ci-visualizar-apuracao/ci-visualizar-apuracao.component';
import { CiListarLancamentoComponent } from './componentes/consulta/ci/ci-lancador/ci-listar-lancamento/ci-listar-lancamento.component';
import { CiAlterarComponent } from './componentes/consulta/ci/ci-user/ci-alterar/ci-alterar.component';
import { CiListarComponent } from './componentes/consulta/ci/ci-user/ci-listar/ci-listar.component';
import { CiNovaComponent } from './componentes/consulta/ci/ci-user/ci-nova/ci-nova.component';
import { CiVisualizarComponent } from './componentes/consulta/ci/ci-user/ci-visualizar/ci-visualizar.component';
import { EscalaAlterarComponent } from './componentes/consulta/escala/escala-alterar/escala-alterar.component';
import { EscalaListarComponent } from './componentes/consulta/escala/escala-listar/escala-listar.component';
import { EscalaNovaComponent } from './componentes/consulta/escala/escala-nova/escala-nova.component';
import { PainelComponent } from './componentes/painel/painel.component';
import { adminGuard } from './guards/admin.guard';
import { funcionarioGuard } from './guards/funcionario.guard';
import { CiVisualizarLancamentoComponent } from './componentes/consulta/ci/ci-lancador/ci-visualizar-lancamento/ci-visualizar-lancamento.component';

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
    { path: 'ci-listar-lancamento/:matricula', component: CiListarLancamentoComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-listar-apuracao/:matricula', component: CiListarApuracaoComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-visualizar/:matricula/:id', component: CiVisualizarComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-visualizar-aprovacao/:matricula/:id', component: CiVisualizarAprovacaoComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-visualizar-apuracao-lancamento/:id', component: CiVisualizarLancamentoComponent, canActivate: [funcionarioGuard] },
    { path: 'ci-visualizar-apuracao/:id', component: CiVisualizarApuracaoComponent, canActivate: [funcionarioGuard] },
    { path: 'funcionario-listar/:matricula', component: FuncionarioListarComponent, canActivate: [adminGuard] },
    { path: 'funcionario-novo/:matricula', component: FuncionarioNovoComponent, canActivate: [adminGuard] },
    { path: 'funcionario-alterar/:matricula/:id', component: FuncionarioAlterarComponent, canActivate: [adminGuard] },
    { path: 'escala-listar', component: EscalaListarComponent, canActivate: [funcionarioGuard] },
    { path: 'escala-nova', component: EscalaNovaComponent, canActivate: [adminGuard] },
    { path: 'escala-alterar/:id', component: EscalaAlterarComponent, canActivate: [adminGuard] }
];
