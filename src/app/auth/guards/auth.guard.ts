import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/user/login']);
    return false;
  }

  const role = authService.getRole();

  if (state.url.startsWith('/admin')) {
    if (role === 'admin') {
      return true;
    } else {
      router.navigate(['/']);
      return false;
    }
  }

  return true;
};

