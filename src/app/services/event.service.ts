import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(private http: HttpClient) { }

  createEvent(req:any): Observable<any> {
    return this.http.post('/event',req);
  }

  getEvent(): Observable<any> {
    return this.http.get('/event');
  }

  updateEvent(eventId:string,req:any): Observable<any> {
    return this.http.put(`/event/${eventId}`,req);
  }
  deleteEvent(eventId:string): Observable<any> {
    return this.http.delete(`/event/${eventId}`);
}
}
