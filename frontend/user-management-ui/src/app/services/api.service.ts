import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  // Root endpoint
  getRoot(): Observable<any> {
    return this.http.get('http://localhost:3001/');
  }

  // Health check
  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  // Dashboard stats
  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`);
  }

  // User endpoints
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  getUser(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, userData);
  }

  updateUser(id: number, userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, userData);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }
}
