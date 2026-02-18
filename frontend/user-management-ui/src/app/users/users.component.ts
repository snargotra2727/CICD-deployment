import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  standalone: false
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  newUser = { username: '', email: '', first_name: '', last_name: '', age: null, city: '' };
  loading = false;
  submitting = false;
  error = '';
  success = '';
  searchTerm = '';

  // Statistics
  totalUsers = 0;
  averageAge = 0;
  topCities: string[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.apiService.getUsers().subscribe({
      next: (res: any) => {
        this.users = res.data || [];
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users';
        this.loading = false;
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  calculateStats() {
    this.totalUsers = this.users.length;
    
    // Calculate average age
    const ages = this.users.filter(u => u.age).map(u => u.age);
    this.averageAge = ages.length ? 
      Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    // Get top cities
    const cityCount: any = {};
    this.users.forEach(u => {
      if (u.city) {
        cityCount[u.city] = (cityCount[u.city] || 0) + 1;
      }
    });
    
    this.topCities = Object.entries(cityCount)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map((item: any) => item[0]);
  }

  createUser() {
    if (!this.newUser.username || !this.newUser.email) {
      this.error = 'Username and email are required';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    this.submitting = true;
    this.apiService.createUser(this.newUser).subscribe({
      next: (res: any) => {
        this.success = 'User created successfully!';
        this.users.unshift(res.data);
        this.calculateStats();
        this.resetForm();
        this.submitting = false;
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create user';
        this.submitting = false;
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  deleteUser(id: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    this.apiService.deleteUser(id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== id);
        this.calculateStats();
        this.success = 'User deleted successfully';
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = 'Failed to delete user';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  resetForm() {
    this.newUser = { username: '', email: '', first_name: '', last_name: '', age: null, city: '' };
  }

  get filteredUsers() {
    if (!this.searchTerm) return this.users;
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(user => 
      user.username?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.first_name?.toLowerCase().includes(term) ||
      user.last_name?.toLowerCase().includes(term) ||
      user.city?.toLowerCase().includes(term)
    );
  }
}
