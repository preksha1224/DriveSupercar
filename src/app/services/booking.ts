import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  constructor(private http: HttpClient){}

  createBooking(req: any): Observable<any> {
    return this.http.post('/book', req);
  }

  getBooking(Id: string): Observable<any> {
    return this.http.get(`/book/${Id}`);
  }

  getallBooking(): Observable<any> {
    return this.http.get(`/book`);
  }

  getBookingAsPerDate(req: any): Observable<any> {
    return this.http.get('/book/booking/by-event-car-date', { params: req });
  }
  
  getBookingByUserId(id: string): Observable<any> {
    return this.http.get(`/book/user/${id}`);
  }

}

