import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-contact.component.html',
  styleUrls: ['./customer-contact.component.css']
})
export class CustomerContactComponent implements OnInit {
  contactForm!: FormGroup;
  customerId: string = '';

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private route: ActivatedRoute,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    // TODO: Get customerId from route params or state management
    // For example, using session storage:
    const storedId = sessionStorage.getItem('customerId');
    if (storedId) {
      this.customerId = storedId;
      this.loadCustomerData();
    }
  }

  loadCustomerData(): void {
    if (this.customerId) {
      // TODO: Replace with actual API call
      this.customerService.getCustomerById(Number(this.customerId)).subscribe({
        next: (data) => {
          if (data) {
            this.contactForm.patchValue({
              email: data.cust_email,
              phone: data.cust_contact_num,
              alternatePhone: data.cust_mobile_num
              // The consent fields don't exist in the backend, so we'll leave them as is
            });
          }
        },
        error: (error) => console.error('Error loading customer data', error)
      });
    }
  }

  initForm(): void {
    this.contactForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      alternatePhone: [''],
      emailConsent: [false],
      smsConsent: [false],
      phoneConsent: [false],
      preferredContactMethod: ['']
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const contactData = this.contactForm.value;
      
      // TODO: Replace with actual API call
      if (this.customerId) {
        this.customerService.updateCustomerContact(this.customerId, contactData).subscribe({
          next: (response) => {
            console.log('Contact info updated successfully', response);
            // Store the customer ID for the next page
            sessionStorage.setItem('customerId', this.customerId);
            this.router.navigate(['/customer-address']);
          },
          error: (error) => console.error('Error updating contact info', error)
        });
      } else {
        // This shouldn't normally happen as contact should be part of an existing customer
        // But we'll handle it just in case
        this.customerService.createCustomer({ 
          cust_email: contactData.email,
          cust_contact_num: contactData.phone,
          cust_mobile_num: contactData.alternatePhone
        }).subscribe({
          next: (response) => {
            console.log('Customer created with contact info', response);
            this.customerId = response.cust_num!.toString();
            // Store the customer ID for the next page
            sessionStorage.setItem('customerId', this.customerId);
            this.router.navigate(['/customer-address']);
          },
          error: (error) => console.error('Error creating customer with contact info', error)
        });
      }
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
