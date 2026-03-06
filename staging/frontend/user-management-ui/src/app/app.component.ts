import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  template: `
    <div style="text-align: center; padding: 50px;">
      <h1 style="color: #2c3e50;">User Management System</h1>
      <h2 style="color: #e74c3c;">PRODUCTION ENVIRONMENT</h2>
      <p>Backend API: http://localhost:3000/api</p>
      <p>Frontend: http://localhost</p>
      <div *ngIf="apiStatus">
        <h3>Backend Status: {{ apiStatus }}</h3>
      </div>
    </div>
  `,
  styles: [],
  standalone: false  // Explicitly set to false
})
export class AppComponent {
  apiStatus: string = 'Checking...';
  
  constructor(private http: HttpClient) {
    this.checkBackend();
  }
  
  checkBackend() {
    this.http.get('/api/health').subscribe({
      next: (res: any) => {
        this.apiStatus = '✅ Connected';
      },
      error: (err) => {
        this.apiStatus = '❌ Disconnected';
      }
    });
  }
}
