import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerContactService } from '../../services/customer-contact.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-contact-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './contact-add.component.html',
  styleUrl: './contact-add.component.css'
})
export class ContactAddComponent implements OnInit {
  contactForm: FormGroup;
  loading: boolean = false;
  error: string | null = null;
  contactTypes: string[] = ['EMAIL', 'PHONE', 'ADDRESS'];
  addressTypes: string[] = ['HOME', 'WORK', 'MAILING'];
  showAddressFields: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private contactService: CustomerContactService
  ) {
    this.contactForm = this.fb.group({
      customercontacttype: ['', Validators.required],
      customercontactvalue: ['', Validators.required],
      effectivedt: [new Date().toISOString().split('T')[0], Validators.required],
      enddate: [''],
      addr_value: [''],
      address_type_id: [''],
      cust_efctv_dt: [new Date().toISOString().split('T')[0]]
    });
  }

  ngOnInit(): void {
    // Listen for changes to contact type to show/hide address fields
    this.contactForm.get('customercontacttype')?.valueChanges.subscribe(value => {
      this.showAddressFields = value === 'ADDRESS';
      
      // Update validators based on contact type
      if (this.showAddressFields) {
        this.contactForm.get('addr_value')?.setValidators([Validators.required]);
        this.contactForm.get('address_type_id')?.setValidators([Validators.required]);
      } else {
        this.contactForm.get('addr_value')?.clearValidators();
        this.contactForm.get('address_type_id')?.clearValidators();
      }
      
      // Update validation state
      this.contactForm.get('addr_value')?.updateValueAndValidity();
      this.contactForm.get('address_type_id')?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.loading = true;
      this.error = null;
      
      console.log('Submitting new contact data:', this.contactForm.value);
      
      this.contactService.createContact(this.contactForm.value)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: response => {
            console.log('Contact created successfully with response:', response);
            
            // Get the ID from the response
            const newId = response.customeridentifier || response.contactid;
            
            if (newId) {
              console.log('Navigating to contact detail with new ID:', newId);
              
              // Add a small delay to ensure the contact is available
              setTimeout(() => {
                this.router.navigate(['/contact-detail', newId]);
              }, 300);
            } else {
              console.log('No ID returned, navigating to contact list');
              this.router.navigate(['/contact-list']);
            }
          },
          error: error => {
            console.error('Error creating contact:', error);
            this.error = `Failed to create contact: ${error.message || 'Unknown error'}`;
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  saveAndAddAnother(): void {
    if (this.contactForm.valid) {
      this.loading = true;
      this.error = null;
      
      this.contactService.createContact(this.contactForm.value)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: response => {
            console.log('Contact created successfully, form reset for another');
            // Reset form for another entry
            this.contactForm.reset({
              customercontacttype: '',
              effectivedt: new Date().toISOString().split('T')[0],
              cust_efctv_dt: new Date().toISOString().split('T')[0]
            });
            // Show success message
            alert('Contact created successfully!');
          },
          error: error => {
            console.error('Error creating contact:', error);
            this.error = `Failed to create contact: ${error.message || 'Unknown error'}`;
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        control?.markAsTouched();
      });
    }
  }
} 