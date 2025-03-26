import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService, CustomerData } from '../../services/customer.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.css'
})
export class CustomerDetailComponent implements OnInit {
  customer: CustomerData | null = null;
  customerId!: number;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      
      console.log('Raw ID parameter:', idParam);
      
      if (idParam === null || idParam === undefined) {
        this.error = "Missing customer ID parameter";
        this.loading = false;
        console.error('Missing ID parameter');
        return;
      }
      
      // Sometimes ID might be "undefined" as a string
      if (idParam === "undefined" || idParam === "null") {
        this.error = "Invalid customer ID: The ID value is undefined";
        this.loading = false;
        console.error('ID parameter is "undefined" or "null" string');
        return;
      }
      
      // Try to convert to number and check if it's valid
      const id = Number(idParam);
      console.log('Converted ID:', id, 'Is NaN:', isNaN(id));
      
      if (isNaN(id)) {
        this.error = `Invalid customer ID: "${idParam}"`;
        this.loading = false;
        console.error('Invalid customer ID parameter:', idParam);
        return;
      }
      
      this.customerId = id;
      console.log('Loading customer with ID:', this.customerId);
      this.loadCustomerData();
    });
  }

  loadCustomerData(): void {
    this.customerService.getCustomerById(this.customerId)
      .pipe(
        finalize(() => this.loading = false),
        catchError(err => {
          this.error = `Failed to load customer: ${err.message}`;
          console.error('API error details:', err);
          
          // If we get a 404 Not Found, the customer might not exist
          if (err.status === 404) {
            this.error = `Customer with ID ${this.customerId} not found. The customer may have been deleted.`;
          }
          
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          // Print detailed information about the API response
          console.log('===== CUSTOMER DETAIL API RESPONSE =====');
          console.log('Raw customer data received:', data);
          console.log('All available properties:', Object.keys(data));
          
          // Log each property individually
          Object.entries(data).forEach(([key, value]) => {
            console.log(`${key}:`, value, `(type: ${typeof value})`);
          });
          
          console.log('========================================');
          
          // Check if customer has essential fields
          if (!data.cust_full_name && !data.cust_type) {
            console.warn('Customer data is missing essential fields');
            this.error = `Customer data for ID ${this.customerId} is incomplete or corrupted.`;
            return;
          }
          
          // Set cust_num from ID if it's missing (to help with edit/delete functionality)
          if (data.cust_num === undefined) {
            console.log('Setting customer ID from route parameter:', this.customerId);
            (data as any).cust_num = this.customerId;
          }
          
          this.customer = data;
          this.error = null;
        } else {
          console.error('No data received from API for customer ID:', this.customerId);
          this.error = `No customer data available for ID: ${this.customerId}`;
        }
      });
  }

  getCustomerTypeLabel(type?: number): string {
    switch(type) {
      case 1: return 'Individual';
      case 2: return 'Business';
      case 3: return 'Government';
      default: return 'Unknown';
    }
  }

  editCustomer(): void {
    this.router.navigate(['/customer-edit', this.customerId]);
  }

  deleteCustomer(): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(this.customerId).subscribe({
        next: () => {
          this.router.navigate(['/customer-list']);
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
        }
      });
    }
  }

  getStatusClass(status?: string): string {
    switch(status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }
}
