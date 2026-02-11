import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-debug',
  template: `
    <div style="background: #f0f0f0; padding: 20px; margin: 20px; border-radius: 5px;">
      <h3>Debug Component</h3>
      <button (click)="testApi()">Test API Connection</button>
      <div *ngIf="response">
        <h4>Response:</h4>
        <pre>{{ response | json }}</pre>
      </div>
      <div *ngIf="error">
        <h4 style="color: red;">Error:</h4>
        <pre>{{ error | json }}</pre>
      </div>
    </div>
  `,
  standalone: false
})
export class DebugComponent implements OnInit {
  response: any = null;
  error: any = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    console.log('DebugComponent initialized');
  }

  testApi(): void {
    console.log('Testing API...');
    this.response = null;
    this.error = null;

    this.apiService.checkHealth().subscribe({
      next: (data) => {
        console.log('API Success:', data);
        this.response = data;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.error = err;
      }
    });
  }
}
