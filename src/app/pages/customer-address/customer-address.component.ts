import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-customer-address',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-address.component.html',
  styleUrl: './customer-address.component.css'
})
export class CustomerAddressComponent implements OnInit {
  customerForm: FormGroup;
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private customerService: CustomerService
  ) {
    // Generate a unique cust_num (starting from 15) for the new customer
    const timestamp = Date.now();
    const generatedId = 15 + (timestamp % 1000);
    
    this.customerForm = this.fb.group({
      cust_num: [generatedId], // Add cust_num to the form with a generated value
      cust_type: ['', Validators.required],
      cust_full_name: ['', Validators.required],
      cust_dob: ['', Validators.required],
      cust_status: ['Active', Validators.required], // Default to Active
      cust_contact_num: ['', Validators.required],
      cust_mobile_num: [''],
      cust_email: ['', [Validators.required, Validators.email]],
      cust_country: ['', Validators.required],
      cust_efctv_dt: [new Date().toISOString().split('T')[0], Validators.required] // Default to today
    });
    
    console.log('Generated cust_num for new customer form:', generatedId);
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.loading = true;
      this.error = null;
      
      console.log('Submitting new customer data:', this.customerForm.value);
      
      this.customerService.createCustomer(this.customerForm.value)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: response => {
            console.log('Customer created successfully, navigating to list');
            // Navigate to customer list
            this.router.navigate(['/customer-list']);
          },
          error: error => {
            console.error('Error creating customer:', error);
            this.error = `Failed to create customer: ${error.message || 'Unknown error'}`;
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.customerForm.controls).forEach(key => {
        const control = this.customerForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  saveAndAddAnother(): void {
    if (this.customerForm.valid) {
      this.loading = true;
      this.error = null;
      
      this.customerService.createCustomer(this.customerForm.value)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: response => {
            console.log('Customer created successfully, form reset for another');
            // Reset form for another entry
            this.customerForm.reset({
              cust_status: 'Active', // Restore default values
              cust_efctv_dt: new Date().toISOString().split('T')[0]
            });
            // Show success message
            alert('Customer created successfully!');
          },
          error: error => {
            console.error('Error creating customer:', error);
            this.error = `Failed to create customer: ${error.message || 'Unknown error'}`;
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.customerForm.controls).forEach(key => {
        const control = this.customerForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
