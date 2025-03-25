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
    
    // TODO: Get customerId from route params or state management
    // this.route.params.subscribe(params => {
    //   if (params['id']) {
    //     this.customerId = params['id'];
    //     this.loadCustomerData();
    //   }
    // });
  }

  // TODO: Implement this method if you need to load existing customer data
  // loadCustomerData(): void {
  //   if (this.customerId) {
  //     this.customerService.getCustomerById(this.customerId).subscribe({
  //       next: (data) => {
  //         this.nameForm.patchValue({
  //           title: data.title,
  //           firstName: data.firstName,
  //           middleName: data.middleName,
  //           lastName: data.lastName,
  //           dateOfBirth: data.dateOfBirth,
  //           gender: data.gender
  //         });
  //       },
  //       error: (error) => console.error('Error loading customer data', error)
  //     });
  //   }
  // }

  initForm(): void {
    this.nameForm = this.fb.group({
      title: [''],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['']
    });
  }

  onSubmit(): void {
    if (this.nameForm.valid) {
      const nameData = this.nameForm.value;
      
      if (this.customerId) {
        // Update existing customer
        this.customerService.updateCustomerName(this.customerId, {
          cust_full_name: nameData.firstName + ' ' + 
            (nameData.middleName ? nameData.middleName + ' ' : '') + 
            nameData.lastName
        }).subscribe({
          next: (response) => {
            console.log('Name updated successfully', response);
            this.router.navigate(['/customer-contact']);
          },
          error: (error) => console.error('Error updating name', error)
        });
      } else {
        // Create new customer
        this.customerService.createCustomer({
          cust_full_name: nameData.firstName + ' ' + 
            (nameData.middleName ? nameData.middleName + ' ' : '') + 
            nameData.lastName,
          cust_type: 1 // Default value
        }).subscribe({
          next: (response) => {
            console.log('Customer created successfully', response);
            this.customerId = response.cust_num!.toString();
            sessionStorage.setItem('customerId', this.customerId);
            this.router.navigate(['/customer-contact']);
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
