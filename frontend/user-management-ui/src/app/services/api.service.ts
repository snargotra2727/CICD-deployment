import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  checkHealth(): Observable<any> {
    return this.http.get('/api/health');
  }

  testConnection(): Observable<any> {
    return this.http.get('/api/test');
  }
}
