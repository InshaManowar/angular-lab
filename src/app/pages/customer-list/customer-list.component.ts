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
          console.log('API Response Data:', data);
          if (data && data.length > 0) {
            console.log('First customer object:', data[0]);
            console.log('Customer ID type:', typeof data[0].cust_num);
            console.log('Customer ID value:', data[0].cust_num);
          }
          this.customers = data;
          this.filteredCustomers = [...data];
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.error = true;
        }
      });
  }

  logCustomerId(id: any, event: Event): void {
    event.stopPropagation();
    console.log('View clicked, ID:', id);
    
    if (id === undefined) {
      console.error('Customer ID is undefined');
    }
  }

  viewCustomer(id: any, event: Event): void {
    event.stopPropagation();
    console.log('Navigating to view customer with ID:', id);
    
    if (!id) {
      console.error('Cannot navigate: Customer ID is invalid', id);
      return;
    }
    
    this.router.navigate(['/customer-detail', id]);
  }
  
  editCustomer(id: any, event: Event): void {
    event.stopPropagation();
    console.log('Navigating to edit customer with ID:', id);
    
    if (!id) {
      console.error('Cannot navigate: Customer ID is invalid', id);
      return;
    }
    
    this.router.navigate(['/customer-edit', id]);
  }

  navigateToCustomerDetail(customer: any): void {
    // Log the entire customer object to inspect all fields
    console.log('Customer object being passed to detail view:', customer);
    console.log('Customer object properties:', Object.keys(customer));
    
    // Try to find a valid ID from various possible fields
    let customerId: any = null;
    
    // Check for common ID fields in order of preference
    if (customer.cust_num !== undefined) {
      customerId = customer.cust_num;
      console.log('Using cust_num as ID:', customerId);
    } else if (customer.id !== undefined) {
      customerId = customer.id;
      console.log('Using id as ID:', customerId);
    } else if (customer.customerId !== undefined) {
      customerId = customer.customerId;
      console.log('Using customerId as ID:', customerId);
    } else {
      // If no ID field is found, try to extract it from another field or generate one
      console.log('No ID field found, attempting to find an alternative');
      
      // If we have an index in the array, try using that as a temporary ID
      const index = this.filteredCustomers.indexOf(customer);
      if (index >= 0) {
        customerId = index + 1; // Use 1-based index as fallback ID
        console.log('Using array index + 1 as fallback ID:', customerId);
      } else {
        // Last resort - generate a random ID
        customerId = Math.floor(Math.random() * 10000) + 1;
        console.log('Using random number as fallback ID:', customerId);
      }
    }
    
    // Now navigate with whatever ID we found
    if (customerId !== null) {
      console.log('Navigating to customer detail with ID:', customerId);
      this.router.navigate(['/customer-detail', customerId]);
    } else {
      console.error('Failed to find or generate a valid customer ID for navigation');
    }
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