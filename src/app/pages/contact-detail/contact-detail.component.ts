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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contactService: CustomerContactService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      
      console.log('Raw ID parameter:', idParam);
      
      if (idParam === null || idParam === undefined) {
        this.error = "Missing contact ID parameter";
        this.loading = false;
        console.error('Missing ID parameter');
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
      console.log('Converted ID:', id, 'Is NaN:', isNaN(id));
      
      if (isNaN(id)) {
        this.error = `Invalid contact ID: "${idParam}"`;
        this.loading = false;
        console.error('Invalid contact ID parameter:', idParam);
        return;
      }
      
      this.contactId = id;
      console.log('Loading contact with ID:', this.contactId);
      this.loadContactData();
    });
  }

  loadContactData(): void {
    this.contactService.getContactById(this.contactId)
      .pipe(
        finalize(() => this.loading = false),
        catchError(err => {
          this.error = `Failed to load contact: ${err.message}`;
          console.error('API error details:', err);
          
          // If we get a 404 Not Found, the contact might not exist
          if (err.status === 404) {
            this.error = `Contact with ID ${this.contactId} not found. The contact may have been deleted.`;
          }
          
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          console.log('Raw contact data received:', data);
          this.contact = data;
          this.error = null;
        } else {
          console.error('No data received from API for contact ID:', this.contactId);
          this.error = `No contact data available for ID: ${this.contactId}`;
        }
      });
  }

  editContact(): void {
    console.log('Navigating to edit contact with ID:', this.contactId);
    this.router.navigate(['contact-edit', this.contactId]);
  }

  getContactTypeLabel(type?: string): string {
    return this.contactService.getContactTypeLabel(type || '');
  }

  getAddressTypeLabel(type?: string): string {
    return this.contactService.getAddressTypeLabel(type || '');
  }
} 