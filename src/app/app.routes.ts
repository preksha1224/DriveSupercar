import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { HomeComponent } from './basic-page/home/home.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
export const routes: Routes = [
  { path: '', component: HomeComponent },

  {
    path: 'admin',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: DashboardComponent }
    ]
  },

  {
    path: 'user',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'registration', component: RegistrationComponent }
    ]
  },

  { path: '**', redirectTo: '' }
];
