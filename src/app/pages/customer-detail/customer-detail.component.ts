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
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          console.log('Customer data received:', data);
          this.customer = data;
          this.error = null;
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
