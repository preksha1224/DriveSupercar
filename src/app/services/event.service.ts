import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(private http: HttpClient) { }

  createEvent(req:any): Observable<any> {
    return this.http.post('/event/create-event',req);
  }

  getEvent(): Observable<any> {
    return this.http.get('/event/get-event');
  }
}
