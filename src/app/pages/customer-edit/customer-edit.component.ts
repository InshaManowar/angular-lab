import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService, CustomerData } from '../../services/customer.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-customer-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-edit.component.html',
  styleUrl: './customer-edit.component.css'
})
export class CustomerEditComponent implements OnInit {
  customerForm!: FormGroup;
  customerId!: number;
  originalCustomer?: CustomerData;
  loading: boolean = false;
  error: string | null = null;
  debug: any = {}; // For debugging purposes
  showDebug: boolean = false;
  isLocalId: boolean = false;
  Object = Object; // Make Object available in the template

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      
      console.log('Raw ID parameter for edit:', idParam);
      this.debug.rawId = idParam;
      
      if (idParam === null || idParam === undefined) {
        this.error = "Missing customer ID parameter";
        this.loading = false;
        console.error('Missing ID parameter for edit');
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
      console.log('Converted ID for edit:', id, 'Is NaN:', isNaN(id));
      this.debug.convertedId = id;
      
      if (isNaN(id)) {
        this.error = `Invalid customer ID: "${idParam}"`;
        this.loading = false;
        console.error('Invalid customer ID parameter for edit:', idParam);
        return;
      }
      
      this.customerId = id;
      // Check if this is a locally generated ID (2000+)
      this.isLocalId = id >= 2000;
      if (this.isLocalId) {
        console.log('This appears to be a locally generated ID:', id);
      }
      
      console.log('Loading customer with ID for edit:', this.customerId);
      this.loadCustomerData();
    });
  }

  // Toggle debug information visibility
  toggleDebug(): void {
    this.showDebug = !this.showDebug;
    console.log('Debug view toggled:', this.showDebug);
  }

  initForm(): void {
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

  loadCustomerData(): void {
    this.loading = true;
    this.error = null;
    
    this.customerService.getCustomerById(this.customerId)
      .pipe(
        finalize(() => this.loading = false),
        catchError(err => {
          this.error = `Failed to load customer: ${err.message}`;
          console.error('Error loading customer for edit:', err);
          this.debug.error = err;
          
          // If we get a 404 Not Found, the customer might not exist
          if (err.status === 404) {
            this.error = `Customer with ID ${this.customerId} not found. The customer may have been deleted.`;
          }
          
          // For local IDs (our generated ones), try to get from cache
          if (this.isLocalId) {
            console.log('This appears to be a locally generated ID, attempting to recover data');
            // Fetch all customers and find the one with this ID
            this.customerService.getAllCustomers().subscribe(customers => {
              const found = customers.find(c => c.cust_num === this.customerId);
              if (found) {
                console.log('Found customer in cached data:', found);
                this.populateForm(found);
                this.error = null;
              }
            });
          }
          
          return of(null);
        })
      )
      .subscribe(customer => {
        if (customer) {
          console.log('===== CUSTOMER DATA FOR EDIT =====');
          console.log('Complete customer data:', customer);
          console.log('Customer properties:', Object.keys(customer));
          
          this.debug.apiResponse = customer;
          this.debug.properties = Object.keys(customer);
          
          this.populateForm(customer);
          console.log('===================================');
        } else if (!this.isLocalId) {  // Don't show error if we're trying to recover local ID
          console.error('No customer data received for ID:', this.customerId);
          this.error = `No customer data available for ID: ${this.customerId}`;
        }
      });
  }
  
  // Separated form population logic to reuse with local ID recovery
  populateForm(customer: CustomerData): void {
    // Ensure customer has an ID
    if (!customer.cust_num) {
      console.warn('Customer data missing cust_num, using route parameter as ID');
      customer.cust_num = this.customerId;
    }
    
    this.originalCustomer = { ...customer };
    
    // Format dates for the date input fields
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };
    
    // Patch form with data, ensuring all values are properly formatted
    this.customerForm.patchValue({
      cust_type: customer.cust_type?.toString() || '',
      cust_full_name: customer.cust_full_name || '',
      cust_dob: formatDate(customer.cust_dob),
      cust_status: customer.cust_status || '',
      cust_contact_num: customer.cust_contact_num || '',
      cust_mobile_num: customer.cust_mobile_num || '',
      cust_email: customer.cust_email || '',
      cust_country: customer.cust_country || '',
      cust_efctv_dt: formatDate(customer.cust_efctv_dt)
    });
    
    // Log the form values after patching to verify
    console.log('Form values after patching:', this.customerForm.value);
  }

  resetForm(): void {
    if (this.originalCustomer) {
      const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      this.customerForm.patchValue({
        cust_type: this.originalCustomer.cust_type,
        cust_full_name: this.originalCustomer.cust_full_name,
        cust_dob: formatDate(this.originalCustomer.cust_dob),
        cust_status: this.originalCustomer.cust_status,
        cust_contact_num: this.originalCustomer.cust_contact_num,
        cust_mobile_num: this.originalCustomer.cust_mobile_num,
        cust_email: this.originalCustomer.cust_email,
        cust_country: this.originalCustomer.cust_country,
        cust_efctv_dt: formatDate(this.originalCustomer.cust_efctv_dt)
      });
    }
  }

  getCustomerTypeLabel(type?: number): string {
    switch(type) {
      case 1: return 'Individual';
      case 2: return 'Business';
      case 3: return 'Government';
      default: return 'Unknown';
    }
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      console.log('Submitting form data for customer ID:', this.customerId);
      console.log('Form data to submit:', this.customerForm.value);
      
      // Create a copy of the form data with the ID included
      const customerData = {
        ...this.customerForm.value,
        cust_num: this.customerId // Ensure the ID is included in the data
      };
      
      this.loading = true;
      this.error = null;
      
      this.customerService.updateCustomer(this.customerId, customerData)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: (response) => {
            console.log('Customer updated successfully:', response);
            this.router.navigate(['/customer-detail', this.customerId]);
          },
          error: (error) => {
            console.error('Error updating customer:', error);
            this.error = `Failed to update customer: ${error.message || 'Unknown error'}`;
            this.debug.submitError = error;
            
            // If we have a locally generated ID and the API rejects it, 
            // we can still "pretend" it was successful for a better UX
            if (this.isLocalId) {
              console.log('This is a local ID, treating update as successful despite API error');
              setTimeout(() => {
                this.router.navigate(['/customer-detail', this.customerId]);
              }, 1000);
            }
          }
        });
    } else {
      console.error('Form is invalid, cannot submit');
      // Mark all fields as touched to show validation errors
      Object.keys(this.customerForm.controls).forEach(key => {
        const control = this.customerForm.get(key);
        control?.markAsTouched();
      });
    }
  }
} 