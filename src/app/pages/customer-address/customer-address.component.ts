import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-address',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-address.component.html',
  styleUrl: './customer-address.component.css'
})
export class CustomerAddressComponent implements OnInit {
  customerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private customerService: CustomerService
  ) {
    this.customerForm = this.fb.group({
      cust_type: ['', Validators.required],
      cust_full_name: ['', Validators.required],
      cust_dob: ['', Validators.required],
      cust_status: ['', Validators.required],
      cust_contact_num: ['', Validators.required],
      cust_mobile_num: [''],
      cust_email: ['', [Validators.required, Validators.email]],
      cust_country: ['', Validators.required],
      cust_efctv_dt: ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.customerService.createCustomer(this.customerForm.value).subscribe(
        response => {
          // Navigate to customer list instead of success page
          this.router.navigate(['/customer-list']);
        },
        error => {
          console.error('Error creating customer:', error);
        }
      );
    }
  }

  saveAndAddAnother(): void {
    if (this.customerForm.valid) {
      this.customerService.createCustomer(this.customerForm.value).subscribe(
        response => {
          // Reset form for another entry
          this.customerForm.reset();
        },
        error => {
          console.error('Error creating customer:', error);
        }
      );
    }
  }
}
