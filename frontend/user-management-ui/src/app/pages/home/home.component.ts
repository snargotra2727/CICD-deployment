import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false
})
export class HomeComponent implements OnInit {
  welcomeMessage = 'Welcome to User Management System';
  backendStatus: string = 'Checking...';
  databaseStatus: string = 'Offline';
  
  features = [
    'User Registration & Authentication',
    'CRUD Operations for User Management',
    'Secure API with JWT Tokens',
    'MySQL Database Integration',
    'Docker Containerization',
    'CI/CD Pipeline'
  ];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('Home component initialized');
    this.checkBackendStatus();
  }

  checkBackendStatus(): void {
    console.log('🟡 HomeComponent: Starting backend check...');
    
    this.apiService.checkHealth().subscribe({
      next: (response) => {
        console.log('🟢 HomeComponent: Backend is online', response);
        this.backendStatus = 'Online';
        console.log('🔵 HomeComponent: backendStatus set to:', this.backendStatus);
        
        // Force UI update
        this.cdr.detectChanges();
        console.log('🔄 Change detection triggered');
      },
      error: (error) => {
        console.error('🔴 HomeComponent: Backend is offline', error);
        this.backendStatus = 'Offline';
        this.cdr.detectChanges();
      }
    });
  }
}
