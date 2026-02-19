import { Routes } from '@angular/router';
import { BmwSelectionComponent } from './cars/bmw-selection.component';
import { BookBmwComponent } from './cars/book-bmw.component';
import { VerifyBmwDetailsComponent } from './cars/verify-bmw.component';
import { SuccessBmwComponent } from './cars/success-bmw.component';
import { LoginComponent } from './auth/login/login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { CarChoiceComponent } from './cars/car-choice/car-choice.component';
import { CarSelectionComponent } from './cars/car-selection/car-selection.component';
import { CarBookComponent } from './cars/car-book/car-book.component';
import { CarVerifyComponent } from './cars/car-verify/car-verify.component';
import { CarSuccessComponent } from './cars/car-success/car-success.component';
import { HomeComponent } from './basic-page/home/home.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent},
	// { path: '', component: CarChoiceComponent, canActivate: [AuthGuard] },
	{ path: 'bmw', component: BmwSelectionComponent },
	{ path: 'audi', component: CarSelectionComponent },
	{ path: 'book-audi', component: CarBookComponent, canActivate: [AuthGuard] },
	{ path: 'book-bmw', component: BookBmwComponent, canActivate: [AuthGuard] },
	{ path: 'verify-audi', component: CarVerifyComponent, canActivate: [AuthGuard] },
	{ path: 'verify-bmw', component: VerifyBmwDetailsComponent, canActivate: [AuthGuard] },
	{ path: 'success-audi', component: CarSuccessComponent, canActivate: [AuthGuard] },
	{ path: 'success-bmw', component: SuccessBmwComponent, canActivate: [AuthGuard] },
	{
		path: 'user',
		children: [
			{ path: 'login', component: LoginComponent },
			{ path: 'registration', component: RegistrationComponent }
		]
	},
	{ path: '**', redirectTo: '' }
];
