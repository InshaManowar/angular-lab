import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-name',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-name.component.html',
  styleUrls: ['./customer-name.component.css']
})
export class CustomerNameComponent implements OnInit {
  nameForm!: FormGroup;
  customerId: string = '';

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private route: ActivatedRoute,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // Check if we have a customerId in the route
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.customerId = params['id'];
        this.loadCustomerData();
      }
    });
  }

  loadCustomerData(): void {
    if (this.customerId) {
      this.customerService.getCustomerById(Number(this.customerId)).subscribe({
        next: (data) => {
          this.nameForm.patchValue({
            cust_full_name: data.cust_full_name,
            cust_dob: data.cust_dob,
            cust_email: data.cust_email,
            cust_contact_num: data.cust_contact_num,
            cust_mobile_num: data.cust_mobile_num
          });
        },
        error: (error) => console.error('Error loading customer data', error)
      });
    }
  }

  initForm(): void {
    this.nameForm = this.fb.group({
      cust_full_name: ['', Validators.required],
      cust_dob: ['', Validators.required],
      cust_email: ['', [Validators.required, Validators.email]],
      cust_contact_num: ['', Validators.required],
      cust_mobile_num: ['']
    });
  }

  onSubmit(): void {
    if (this.nameForm.valid) {
      const nameData = this.nameForm.value;
      
      if (this.customerId) {
        // Update existing customer
        this.customerService.updateCustomer(Number(this.customerId), nameData).subscribe({
          next: (response) => {
            console.log('Customer updated successfully', response);
            this.router.navigate(['/customer-identity']);
          },
          error: (error) => console.error('Error updating customer', error)
        });
      } else {
        // Create new customer
        this.customerService.createCustomer({
          cust_full_name: nameData.cust_full_name,
          cust_dob: nameData.cust_dob,
          cust_email: nameData.cust_email,
          cust_contact_num: nameData.cust_contact_num,
          cust_mobile_num: nameData.cust_mobile_num,
          cust_type: 1, // Default value
          cust_status: 'Active', // Default value
          cust_efctv_dt: new Date().toISOString().slice(0, 10) // Today's date
        }).subscribe({
          next: (response) => {
            console.log('Customer created successfully', response);
            this.customerId = response.cust_num!.toString();
            sessionStorage.setItem('customerId', this.customerId);
            this.router.navigate(['/customer-identity']);
          },
          error: (error) => console.error('Error creating customer', error)
        });
      }
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.nameForm.controls).forEach(key => {
        const control = this.nameForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
