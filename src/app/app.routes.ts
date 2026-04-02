import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { HomeComponent } from './basic-page/home/home.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { BookingPageComponent } from './booking-page/booking-page.component';
import { DetailPageComponent } from './basic-page/detail-page/detail-page.component';
import { BookingdetailspageComponent } from './bookingdetailspage/bookingdetailspage.component';
import { BookingSuccessComponent } from './booking-page/booking-success.component';
import { ShowBookingUserComponent } from './show-booking-user/show-booking-user.component';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'booking', component: BookingPageComponent },
  { path: 'booking-success', component: BookingSuccessComponent },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: DashboardComponent },
    ],
  },

  {
    path: 'user',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'registration', component: RegistrationComponent },
    ],
  },
  {
    path: 'booking',
    canActivate: [AuthGuard],
    component: BookingPageComponent,
  },

  {
    path: 'detail',
    canActivate: [AuthGuard],
    component: DetailPageComponent,
  },
  {
    path: 'Bookingdetail',
    canActivate: [AuthGuard],
    component: BookingdetailspageComponent,
  },
   {
    path: 'ShowBookingUser',
    canActivate:[AuthGuard],
    component:ShowBookingUserComponent
  },

  { path: '**', redirectTo: '' },
];
