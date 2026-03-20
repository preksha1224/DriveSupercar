import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  constructor(private http: HttpClient){}
  
createBooking(req: any): Observable<any> {
  return this.http.post('/book/createBooking', req);
}

getBooking(Id: string): Observable<any> {
  return this.http.get(`/book/getBookings/${Id}`);
}

getallBooking(): Observable<any> {
  return this.http.get(`book/getAllBookings`);
}
}
