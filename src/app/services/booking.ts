import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  constructor(private http: HttpClient){}
  
createBooking(req: any): Observable<any> {
  return this.http.post('http://localhost:3000/book/createBooking', req);
}

  getBooking() : Observable<any>{
    return this.http.get('/book/getBookings/id');
  }
}
