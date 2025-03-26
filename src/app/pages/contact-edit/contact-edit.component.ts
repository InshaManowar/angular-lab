import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerContactService, CustomerContactDetails } from '../../services/customer-contact.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-contact-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './contact-edit.component.html',
  styleUrl: './contact-edit.component.css'
})
export class ContactEditComponent implements OnInit {
  contactForm!: FormGroup;
  contactId!: number;
  originalContact?: CustomerContactDetails;
  loading: boolean = false;
  error: string | null = null;
  contactTypes: string[] = ['EMAIL', 'PHONE', 'ADDRESS'];
  addressTypes: string[] = ['HOME', 'WORK', 'MAILING'];
  showAddressFields: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private contactService: CustomerContactService
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      
      console.log('Raw ID parameter for edit:', idParam);
      
      if (idParam === null || idParam === undefined) {
        this.error = "Missing contact ID parameter";
        this.loading = false;
        console.error('Missing ID parameter for edit');
        return;
      }
      
      // Sometimes ID might be "undefined" as a string
      if (idParam === "undefined" || idParam === "null") {
        this.error = "Invalid contact ID: The ID value is undefined";
        this.loading = false;
        console.error('ID parameter is "undefined" or "null" string');
        return;
      }
      
      // Try to convert to number and check if it's valid
      const id = Number(idParam);
      console.log('Converted ID for edit:', id, 'Is NaN:', isNaN(id));
      
      if (isNaN(id)) {
        this.error = `Invalid contact ID: "${idParam}"`;
        this.loading = false;
        console.error('Invalid contact ID parameter for edit:', idParam);
        return;
      }
      
      this.contactId = id;
      console.log('Loading contact with ID for edit:', this.contactId);
      this.loadContactData();
    });
  }

  initForm(): void {
    this.contactForm = this.fb.group({
      customercontacttype: ['', Validators.required],
      customercontactvalue: ['', Validators.required],
      effectivedt: ['', Validators.required],
      enddate: [''],
      addr_value: [''],
      address_type_id: [''],
      cust_efctv_dt: ['']
    });

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

  loadContactData(): void {
    this.loading = true;
    this.error = null;
    
    this.contactService.getContactById(this.contactId)
      .pipe(
        finalize(() => this.loading = false),
        catchError(err => {
          this.error = `Failed to load contact: ${err.message}`;
          console.error('Error loading contact for edit:', err);
          
          // If we get a 404 Not Found, the contact might not exist
          if (err.status === 404) {
            this.error = `Contact with ID ${this.contactId} not found. The contact may have been deleted.`;
          }
          
          return of(null);
        })
      )
      .subscribe(contact => {
        if (contact) {
          console.log('Complete contact data:', contact);
          
          this.originalContact = { ...contact };
          
          // Format dates for the date input fields
          const formatDate = (dateString: string | undefined) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
          };
          
          // Patch form with data, ensuring all values are properly formatted
          this.contactForm.patchValue({
            customercontacttype: contact.customercontacttype || '',
            customercontactvalue: contact.customercontactvalue || '',
            effectivedt: formatDate(contact.effectivedt),
            enddate: formatDate(contact.enddate),
            addr_value: contact.addr_value || '',
            address_type_id: contact.address_type_id || '',
            cust_efctv_dt: formatDate(contact.cust_efctv_dt)
          });
          
          // Set showAddressFields based on the current contact type
          this.showAddressFields = contact.customercontacttype === 'ADDRESS';
          
          // Log the form values after patching to verify
          console.log('Form values after patching:', this.contactForm.value);
        } else {
          console.error('No contact data received for ID:', this.contactId);
          this.error = `No contact data available for ID: ${this.contactId}`;
        }
      });
  }

  resetForm(): void {
    if (this.originalContact) {
      const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      this.contactForm.patchValue({
        customercontacttype: this.originalContact.customercontacttype || '',
        customercontactvalue: this.originalContact.customercontactvalue || '',
        effectivedt: formatDate(this.originalContact.effectivedt),
        enddate: formatDate(this.originalContact.enddate),
        addr_value: this.originalContact.addr_value || '',
        address_type_id: this.originalContact.address_type_id || '',
        cust_efctv_dt: formatDate(this.originalContact.cust_efctv_dt)
      });
    }
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      console.log('Submitting form data for contact ID:', this.contactId);
      console.log('Form data to submit:', this.contactForm.value);
      
      // Create a copy of the form data with the ID included
      const contactData = {
        ...this.contactForm.value,
        customeridentifier: this.contactId // Ensure the ID is included in the data
      };
      
      this.loading = true;
      this.contactService.updateContact(this.contactId, contactData).subscribe({
        next: (response) => {
          console.log('Contact updated successfully:', response);
          this.loading = false;
          this.router.navigate(['contact-detail', this.contactId]);
        },
        error: (error) => {
          console.error('Error updating contact:', error);
          this.loading = false;
          this.error = `Failed to update contact: ${error.message || 'Unknown error'}`;
        }
      });
    } else {
      console.error('Form is invalid, cannot submit');
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        control?.markAsTouched();
      });
    }
  }
} 