import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css'
})
export class CustomerListComponent implements OnInit {
  customers: any[] = [];
  filteredCustomers: any[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  error: boolean = false;

  constructor(
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = false;
    
    this.customerService.getAllCustomers()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (data) => {
          this.customers = data;
          this.filteredCustomers = [...data];
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.error = true;
        }
      });
  }

  filterCustomers(): void {
    if (!this.searchTerm) {
      this.filteredCustomers = [...this.customers];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCustomers = this.customers.filter(customer => 
        customer.cust_full_name?.toLowerCase().includes(term) || 
        customer.cust_email?.toLowerCase().includes(term) ||
        customer.cust_num?.toString().includes(term)
      );
    }
  }

  getCustomerTypeLabel(type: number): string {
    switch(type) {
      case 1: return 'Individual';
      case 2: return 'Business';
      case 3: return 'Government';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  deleteCustomer(id: number): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          // Refresh the list
          this.loadCustomers();
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
        }
      });
    }
  }
} 