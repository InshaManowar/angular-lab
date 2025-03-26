import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerContactService, CustomerContactDetails } from '../../services/customer-contact.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contact-detail.component.html',
  styleUrl: './contact-detail.component.css'
})
export class ContactDetailComponent implements OnInit {
  contact: CustomerContactDetails | null = null;
  contactId!: number;
  loading: boolean = false;
  error: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contactService: CustomerContactService
  ) {}

  ngOnInit(): void {
    console.log('ContactDetailComponent initialized');
    this.route.paramMap.subscribe(
      params => {
        console.log('Route params:', params);
        const idParam = params.get('id');
        console.log('ID from route params:', idParam);
        
        if (idParam) {
          // Convert to number and check validity
          this.contactId = +idParam;
          
          if (isNaN(this.contactId) || this.contactId <= 0) {
            console.error('Invalid ID parameter:', idParam);
            this.errorMessage = 'Invalid contact ID provided';
            this.loading = false;
            return;
          }
          
          console.log(`Loading contact details for ID: ${this.contactId}`);
          this.loadContactDetails();
        } else {
          console.error('No ID parameter found in route');
          this.errorMessage = 'No contact ID provided';
          this.loading = false;
        }
      },
      error => {
        console.error('Error extracting route parameters:', error);
        this.errorMessage = 'Error loading contact details';
        this.loading = false;
      }
    );
  }

  loadContactDetails(): void {
    this.loading = true;
    console.log(`Calling contactService.getContactById(${this.contactId})`);
    
    this.contactService.getContactById(this.contactId).subscribe({
      next: (data) => {
        console.log('Contact data received:', data);
        this.contact = data;
        this.loading = false;
        
        if (!this.contact) {
          console.error('Contact data is null or undefined');
          this.errorMessage = 'Contact details not found';
        } else if (typeof this.contact !== 'object') {
          console.error('Unexpected contact data type:', typeof this.contact);
          this.errorMessage = 'Invalid contact data format';
        } else {
          console.log('Contact loaded successfully:', this.contact);
        }
      },
      error: (error) => {
        console.error('Error fetching contact details:', error);
        this.errorMessage = error.message || 'Failed to load contact details';
        this.loading = false;
      }
    });
  }

  editContact(): void {
    console.log('Navigating to edit contact with ID:', this.contactId);
    this.router.navigate(['contact-edit', this.contactId]);
  }

  getContactTypeLabel(typeCode: string | number): string {
    if (typeCode === 'EMAIL' || typeCode === 1) {
      return 'Email';
    } else if (typeCode === 'PHONE' || typeCode === 2) {
      return 'Phone';
    } else if (typeCode === 'ADDRESS' || typeCode === 3) {
      return 'Address';
    } else {
      return typeCode?.toString() || 'Unknown';
    }
  }

  getAddressTypeLabel(typeId: number): string {
    switch (typeId) {
      case 1: return 'Home';
      case 2: return 'Business';
      case 3: return 'Billing';
      case 4: return 'Shipping';
      default: return 'Other';
    }
  }
} 