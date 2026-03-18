import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Booking {
  constructor(private http: HttpClient){}

  createBooking(req: any) : Observable<any>{
    return this.http.post('/book/createBooking',req);
  }

  getBooking() : Observable<any>{
    return this.http.get('/book/getBookings/id');
  }
}
