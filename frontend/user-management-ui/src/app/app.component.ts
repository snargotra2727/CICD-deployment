import { Component, OnInit, NgZone } from '@angular/core';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent implements OnInit {
  backendStatus: string = 'Checking...';
  currentYear: number = new Date().getFullYear();

  constructor(
    private apiService: ApiService,
    private ngZone: NgZone
  ) {
    console.log('🚀 AppComponent constructor called');
  }

  ngOnInit(): void {
    console.log('🎯 AppComponent ngOnInit - calling checkHealth()');
    this.checkBackend();
  }

  checkBackend(): void {
    console.log('📞 Making API call to http://127.0.0.1:3000/api/health');

    this.apiService.checkHealth().subscribe({
      next: (response) => {
        console.log('✅✅✅ AppComponent SUCCESS:', response);
        
        // Force update within Angular zone
        this.ngZone.run(() => {
          this.backendStatus = 'Online';
          console.log('📊 backendStatus is now:', this.backendStatus);
        });
      },
      error: (error) => {
        console.error('❌❌❌ AppComponent ERROR:', error);
        console.error('Error details:', error.status, error.message);
        
        this.ngZone.run(() => {
          this.backendStatus = 'Offline';
        });
      }
    });
  }

  manualTest(): void {
    console.log('🔄 Manual test triggered');
    this.backendStatus = 'Testing...';
    this.checkBackend();
  }
}
