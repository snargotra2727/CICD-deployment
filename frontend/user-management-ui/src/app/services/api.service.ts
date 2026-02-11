import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
    // Using relative URLs through Nginx proxy

  constructor(private http: HttpClient) {}

  // Health check
  checkHealth(): Observable<any> {
    return this.http.get(`/api/health`);
  }

  // Simple test endpoint
  testConnection(): Observable<any> {
    return this.http.get(`/api/test`);
  }
}
