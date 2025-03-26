import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerContactService, CustomerContactDetails } from '../../services/customer-contact.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.css'
})
export class ContactListComponent implements OnInit {
  contacts: CustomerContactDetails[] = [];
  filteredContacts: CustomerContactDetails[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  error: boolean = false;

  constructor(
    private router: Router,
    private contactService: CustomerContactService
  ) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.loading = true;
    this.error = false;
    
    this.contactService.getAllContacts()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (data) => {
          console.log('API Response Data:', data);
          this.contacts = data;
          this.filteredContacts = [...data];
        },
        error: (error) => {
          console.error('Error loading contacts:', error);
          this.error = true;
        }
      });
  }

  filterContacts(): void {
    if (!this.searchTerm) {
      this.filteredContacts = [...this.contacts];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredContacts = this.contacts.filter(contact => 
        contact.customercontactvalue?.toLowerCase().includes(term) || 
        contact.customercontacttype?.toLowerCase().includes(term) ||
        contact.customeridentifier?.toString().includes(term)
      );
    }
  }

  navigateToContactDetail(contact: CustomerContactDetails): void {
    if (!contact.customeridentifier) {
      console.error('Cannot navigate: Contact ID is missing');
      return;
    }
    
    console.log('Navigating to contact detail with ID:', contact.customeridentifier);
    this.router.navigate(['contact-detail', contact.customeridentifier]);
  }

  navigateToContactEdit(contact: CustomerContactDetails): void {
    if (!contact.customeridentifier) {
      console.error('Cannot navigate: Contact ID is missing');
      return;
    }
    
    console.log('Navigating to contact edit with ID:', contact.customeridentifier);
    this.router.navigate(['contact-edit', contact.customeridentifier]);
  }

  deleteContact(contact: CustomerContactDetails): void {
    if (!contact.customeridentifier) {
      console.error('Cannot delete: Contact ID is missing');
      return;
    }
    
    if (confirm('Are you sure you want to delete this contact?')) {
      this.contactService.deleteContact(contact.customeridentifier).subscribe({
        next: () => {
          this.loadContacts();
        },
        error: (error) => {
          console.error('Error deleting contact:', error);
          alert('Failed to delete contact: ' + (error.message || 'Unknown error'));
        }
      });
    }
  }
} 