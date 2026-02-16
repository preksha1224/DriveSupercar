import { Routes } from '@angular/router';
import { CarChoiceComponent } from './cars/car-choice.component';
import { BmwSelectionComponent } from './cars/bmw-selection.component';
import { AudiSelectionComponent } from './cars/audi-selection.component';
import { BookAudiComponent } from './cars/book-audi.component';
import { BookBmwComponent } from './cars/book-bmw.component';
import { VerifyAudiDetailsComponent } from './cars/verify-audi.component';
import { VerifyBmwDetailsComponent } from './cars/verify-bmw.component';
import { SuccessAudiComponent } from './cars/success-audi.component';
import { SuccessBmwComponent } from './cars/success-bmw.component';
import { LoginComponent } from './auth/login/login.component';
import { RegistrationComponent } from './auth/registration/registration.component';
import { AuthGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
	{ path: '', component: CarChoiceComponent, canActivate: [AuthGuard] },
	{ path: 'bmw', component: BmwSelectionComponent },
	{ path: 'audi', component: AudiSelectionComponent },
	{ path: 'book-audi', component: BookAudiComponent, canActivate: [AuthGuard] },
	{ path: 'book-bmw', component: BookBmwComponent, canActivate: [AuthGuard] },
	{ path: 'verify-audi', component: VerifyAudiDetailsComponent, canActivate: [AuthGuard] },
	{ path: 'verify-bmw', component: VerifyBmwDetailsComponent, canActivate: [AuthGuard] },
	{ path: 'success-audi', component: SuccessAudiComponent, canActivate: [AuthGuard] },
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
