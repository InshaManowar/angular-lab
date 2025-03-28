import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-customer-identity',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-identity.component.html',
  styleUrls: ['./customer-identity.component.css']
})
export class CustomerIdentityComponent implements OnInit {
  identityForm!: FormGroup;
  customerId: string = '';
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private route: ActivatedRoute,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Try to get customerId from session storage (if coming from customer-name)
    const storedId = sessionStorage.getItem('customerId');
    if (storedId) {
      this.customerId = storedId;
      this.loadCustomerData();
    }
    
    // Also check route params (if editing existing customer)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.customerId = params['id'];
        this.loadCustomerData();
      }
    });
  }

  loadCustomerData(): void {
    if (this.customerId) {
      this.loading = true;
      this.error = null;
      
      this.customerService.getCustomerById(Number(this.customerId))
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (data) => {
            console.log('Loaded customer data:', data);
            this.identityForm.patchValue({
              cust_type: data.cust_type?.toString(),
              cust_status: data.cust_status || 'Active',
              cust_country: data.cust_country || '',
              cust_efctv_dt: data.cust_efctv_dt || new Date().toISOString().slice(0, 10)
            });
          },
          error: (error) => {
            console.error('Error loading customer data', error);
            this.error = 'Failed to load customer data. Please try again.';
          }
        });
    }
  }

  initForm(): void {
    this.identityForm = this.fb.group({
      cust_type: ['', Validators.required],
      cust_status: ['', Validators.required],
      cust_country: ['', Validators.required],
      cust_efctv_dt: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.identityForm.valid) {
      const identityData = this.identityForm.value;
      this.loading = true;
      this.error = null;
      
      console.log('Submitting form with customerId:', this.customerId);
      console.log('Form data:', identityData);
      
      if (this.customerId) {
        // Update existing customer
        this.customerService.updateCustomer(Number(this.customerId), {
          cust_type: Number(identityData.cust_type),
          cust_status: identityData.cust_status,
          cust_country: identityData.cust_country,
          cust_efctv_dt: identityData.cust_efctv_dt
        })
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (response) => {
            console.log('Customer identity updated successfully', response);
            // Clear the session storage as we're done with this flow
            sessionStorage.removeItem('customerId');
            this.router.navigate(['/customer-list']);
          },
          error: (error) => {
            console.error('Error updating customer identity', error);
            this.error = 'Failed to update customer. Please try again.';
          }
        });
      } else {
        // This shouldn't happen since we should come from customer-name
        // But just in case, redirect to customer-name
        console.warn('No customer ID found, redirecting to customer name form');
        this.loading = false;
        this.router.navigate(['/customer-name']);
      }
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.identityForm.controls).forEach(key => {
        const control = this.identityForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
