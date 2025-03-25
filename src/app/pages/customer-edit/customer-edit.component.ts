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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && !isNaN(Number(id))) {
        this.customerId = Number(id);
        console.log('Editing customer with ID:', this.customerId);
        this.loadCustomerData();
      } else {
        this.error = "Invalid customer ID";
        this.loading = false;
        console.error('Invalid customer ID parameter:', id);
      }
    });
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
          return of(null);
        })
      )
      .subscribe(customer => {
        if (customer) {
          console.log('Customer data for edit:', customer);
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
      });
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
      this.customerService.updateCustomer(this.customerId, this.customerForm.value).subscribe({
        next: (response) => {
          this.router.navigate(['/customer-detail', this.customerId]);
        },
        error: (error) => {
          console.error('Error updating customer:', error);
        }
      });
    }
  }
} 