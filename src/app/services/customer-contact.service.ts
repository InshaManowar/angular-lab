import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

/**
 * Customer Contact Details interface
 */
export interface CustomerContactDetails {
  customeridentifier?: number;
  customercontacttype?: string;
  customercontactvalue?: string;
  effectivedt?: string;
  enddate?: string;
  addr_value?: string;
  address_type_id?: string;
  cust_efctv_dt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerContactService {
  private apiUrl = 'http://localhost:8020/api/customercontact';
  private contactsCache: CustomerContactDetails[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  constructor(private http: HttpClient) { }

  /**
   * Get all customer contacts
   * @returns Observable of customer contact data array
   */
  getAllContacts(): Observable<CustomerContactDetails[]> {
    const currentTime = Date.now();
    if (this.contactsCache && (currentTime - this.lastFetchTime < this.CACHE_DURATION)) {
      console.log('Using cached contact data:', this.contactsCache);
      return of(this.contactsCache);
    }
    
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => {
        console.log('Raw Contact API response:', response);
      }),
      map(response => {
        // Check if response is an array or an object with content property
        let contacts = Array.isArray(response) ? response : (response.content || []);
        
        console.log('Processed contact data:', contacts);
        return contacts;
      }),
      tap(contacts => {
        this.contactsCache = contacts;
        this.lastFetchTime = Date.now();
      }),
      catchError(error => {
        console.error('Error fetching contacts:', error);
        return of([]);
      })
    );
  }

  /**
   * Get a contact by ID
   * @param id Contact ID
   * @returns Observable of contact data
   */
  getContactById(id: number): Observable<CustomerContactDetails> {
    console.log(`Making API request to: ${this.apiUrl}/${id}`);
    
    // Check if id is valid
    if (isNaN(id) || id <= 0) {
      console.error('Invalid contact ID:', id);
      return throwError(() => new Error('Invalid contact ID'));
    }
    
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        console.log('===== RAW CONTACT API RESPONSE =====');
        console.log('Full API response:', response);
        
        // Handle different response formats
        let contactData: any = response;
        
        // Check if response is wrapped in a container object
        if (response && typeof response === 'object') {
          // Check for common wrapper properties
          if (response.data) {
            contactData = response.data;
          } else if (response.contact) {
            contactData = response.contact;
          } else if (response.content) {
            contactData = response.content;
          }
        }
        
        console.log('Final contact data being returned:', contactData);
        console.log('==================================');
        
        return contactData;
      }),
      catchError(error => {
        console.error(`Error fetching contact with ID ${id}:`, error);
        return throwError(() => new Error('Failed to load contact details'));
      })
    );
  }

  /**
   * Create a new contact
   * @param contactData Contact data
   * @returns Observable of created contact data
   */
  createContact(contactData: CustomerContactDetails): Observable<CustomerContactDetails> {
    // Clear the cache so the list will be refreshed on next load
    this.contactsCache = null;
    
    return this.http.post<CustomerContactDetails>(this.apiUrl, contactData).pipe(
      tap(response => {
        console.log('Contact created successfully:', response);
        // Ensure the cache is invalidated
        this.contactsCache = null;
      }),
      catchError(error => {
        console.error('Error creating contact:', error);
        return throwError(() => new Error('Failed to create contact: ' + (error.message || 'Unknown error')));
      })
    );
  }

  /**
   * Update contact
   * @param id Contact ID
   * @param contactData Contact data
   * @returns Observable of updated contact data
   */
  updateContact(id: number, contactData: CustomerContactDetails): Observable<CustomerContactDetails> {
    // Clear the cache so the list will be refreshed on next load
    this.contactsCache = null;
    
    return this.http.put<CustomerContactDetails>(`${this.apiUrl}/${id}`, contactData).pipe(
      tap(response => {
        console.log('Contact updated successfully:', response);
        // Ensure the cache is invalidated
        this.contactsCache = null;
      }),
      catchError(error => {
        console.error('Error updating contact:', error);
        return throwError(() => new Error('Failed to update contact: ' + (error.message || 'Unknown error')));
      })
    );
  }

  /**
   * Delete a contact
   * @param id Contact ID
   * @returns Observable of response
   */
  deleteContact(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Clear cache on deletion
        this.contactsCache = null;
      })
    );
  }

  /**
   * Get contact type label
   */
  getContactTypeLabel(type: string): string {
    switch(type) {
      case 'EMAIL': return 'Email';
      case 'PHONE': return 'Phone';
      case 'ADDRESS': return 'Address';
      default: return type || 'Unknown';
    }
  }

  /**
   * Get address type label
   */
  getAddressTypeLabel(type: string): string {
    switch(type) {
      case 'HOME': return 'Home';
      case 'WORK': return 'Work';
      case 'MAILING': return 'Mailing';
      default: return type || 'Unknown';
    }
  }
} 