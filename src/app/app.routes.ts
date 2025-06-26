import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { PainelComponent } from './componentes/painel/painel.component';
import { PfComponent } from './componentes/pf/pf.component';
// Assumindo que os componentes DRH e TRE existem e foram declarados no módulo principal ou são standalone.
import { DrhComponent } from './componentes/drh/drh.component';
import { TreComponent } from './componentes/tre/tre.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    {
        path: 'painel/:matricula',
        component: PainelComponent,
        canActivate: [authGuard], // Protegendo a rota do painel
        children: [
            { path: 'drh', component: DrhComponent },
            { path: 'tre', component: TreComponent },
            { path: 'pf', component: PfComponent }
        ]
    }
];
