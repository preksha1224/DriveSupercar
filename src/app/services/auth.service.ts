import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

interface RegisterResponse {
  success: boolean;
  message: string;
  user: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private router=inject(Router)
  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post('/auth/login', { username:email, password });
  }

  register(userData: any): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>('/auth/registration', userData);
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    this.router.navigateByUrl('/user/login')
  }

  isLoggedIn(): boolean {
    const user = localStorage.getItem('user');
    if (user) {
      return true;
    }else {
      return false;
    }
  }

  setAuthToken(token: string, user: any): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

getRole(): string | null {
  return localStorage.getItem('role');
}

isAdmin(): boolean {
  return this.getRole() === 'admin';
}

isCustomer(): boolean {
  return this.getRole() === 'customer';
}

}
