import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-identity',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-identity.component.html',
  styleUrls: ['./customer-identity.component.css']
})
export class CustomerIdentityComponent implements OnInit {
  identityForm!: FormGroup;
  frontFile: File | null = null;
  backFile: File | null = null;
  frontFileName: string = '';
  backFileName: string = '';
  customerId: string = ''; // This would typically come from a route param or state management

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.initForm();
    // TODO: If editing an existing customer, load their data
    // this.loadCustomerData();
  }

  // TODO: Implement this method if you need to load existing customer data
  // loadCustomerData(): void {
  //   if (this.customerId) {
  //     this.customerService.getCustomerById(this.customerId).subscribe({
  //       next: (data) => {
  //         this.identityForm.patchValue({
  //           idType: data.idType,
  //           idNumber: data.idNumber,
  //           issueDate: data.issueDate,
  //           expiryDate: data.expiryDate
  //         });
  //       },
  //       error: (error) => console.error('Error loading customer data', error)
  //     });
  //   }
  // }

  initForm(): void {
    this.identityForm = this.fb.group({
      idType: ['', Validators.required],
      idNumber: ['', Validators.required],
      issueDate: [''],
      expiryDate: ['', Validators.required]
    });
  }

  onFileSelected(event: any, type: 'front' | 'back'): void {
    const file = event.target.files[0];
    if (file) {
      if (type === 'front') {
        this.frontFile = file;
        this.frontFileName = file.name;
      } else {
        this.backFile = file;
        this.backFileName = file.name;
      }
    }
  }

  onSubmit(): void {
    if (this.identityForm.valid && this.frontFile) {
      // Handle form submission with files
      const formData = {
        ...this.identityForm.value,
        frontImage: this.frontFile,
        backImage: this.backFile
      };
      
      // TODO: Replace with actual API call
      if (this.customerId) {
        // Update existing customer
        this.customerService.updateCustomerIdentity(this.customerId, formData).subscribe({
          next: (response) => {
            console.log('Identity updated successfully', response);
            this.router.navigate(['/customer-contact']);
          },
          error: (error) => console.error('Error updating identity', error)
        });
      } else {
        // Create new customer
        this.customerService.createCustomer(formData).subscribe({
          next: (response) => {
            console.log('Customer created successfully', response);
            this.customerId = response.cust_num!.toString();
            this.router.navigate(['/customer-contact']);
          },
          error: (error) => console.error('Error creating customer', error)
        });
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
