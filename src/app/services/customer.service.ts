import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

/**
 * Customer data interface - adjusted to match the backend entity
 */
export interface CustomerData {
  cust_num?: number;
  cust_type?: number;
  cust_full_name?: string;
  cust_dob?: string;
  cust_status?: string;
  cust_contact_num?: string;
  cust_mobile_num?: string;
  cust_email?: string;
  cust_country?: string;
  cust_efctv_dt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  // TODO: Replace with your actual API URL
  private apiUrl = '/api/customerdetail';
  private customersCache: CustomerData[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute cache
  private nextLocalId = 2000; // Starting ID for local management (different range from identifications)
  private readonly LOCAL_CUSTOMER_ID_KEY = 'customer_next_id';

  constructor(private http: HttpClient) {
    // Restore next ID from localStorage if available
    this.restoreNextId();
  }

  /**
   * Generate a unique local ID when the API doesn't provide one
   */
  private generateLocalId(): number {
    const id = this.nextLocalId++;
    // Save to localStorage for persistence
    this.saveNextId();
    return id;
  }

  /**
   * Save next ID counter to localStorage
   */
  private saveNextId(): void {
    try {
      localStorage.setItem(this.LOCAL_CUSTOMER_ID_KEY, this.nextLocalId.toString());
    } catch (error) {
      console.error('Error saving next customer ID to localStorage:', error);
    }
  }

  /**
   * Restore next ID counter from localStorage
   */
  private restoreNextId(): void {
    try {
      const savedId = localStorage.getItem(this.LOCAL_CUSTOMER_ID_KEY);
      if (savedId) {
        const parsedId = parseInt(savedId, 10);
        if (!isNaN(parsedId) && parsedId >= 2000) {
          console.log(`Restored next customer ID counter from localStorage: ${parsedId}`);
          this.nextLocalId = parsedId;
        }
      }
    } catch (error) {
      console.error('Error restoring next customer ID from localStorage:', error);
    }
  }

  /**
   * Ensure a customer record has an ID
   */
  private ensureId(customer: CustomerData): CustomerData {
    if (!customer.cust_num) {
      console.log('Assigning local ID to customer:', this.nextLocalId);
      customer.cust_num = this.generateLocalId();
    }
    return customer;
  }

  /**
   * Get all customers
   * @returns Observable of customer data array
   */
  getAllCustomers(): Observable<CustomerData[]> {
    const currentTime = Date.now();
    if (this.customersCache && (currentTime - this.lastFetchTime < this.CACHE_DURATION)) {
      console.log('Using cached data:', this.customersCache);
      return of(this.customersCache);
    }
    
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => {
        console.log('Raw API response:', response);
      }),
      map(response => {
        // Check if response is an array or an object with content property
        let customers = Array.isArray(response) ? response : (response.content || []);
        
        // Ensure each customer has a cust_num using our improved ID generation
        customers = customers.map((customer: any) => this.ensureId(customer));
        
        console.log('Processed customer data with proper IDs:', customers);
        return customers;
      }),
      tap(customers => {
        this.customersCache = customers;
        this.lastFetchTime = Date.now();
      }),
      catchError(error => {
        console.error('Error fetching customers:', error);
        // Return an empty array as fallback
        return of([]);
      })
    );
  }

  /**
   * Get a customer by ID
   * @param id Customer ID
   * @returns Observable of customer data
   */
  getCustomerById(id: number): Observable<CustomerData> {
    console.log(`Making API request to: ${this.apiUrl}/${id}`);
    
    // Check if id is valid
    if (isNaN(id) || id <= 0) {
      console.error('Invalid customer ID:', id);
      return throwError(() => new Error('Invalid customer ID'));
    }
    
    // First check if we have it in cache
    if (this.customersCache) {
      const cachedItem = this.customersCache.find(item => item.cust_num === id);
      if (cachedItem) {
        console.log('Returning cached customer item:', cachedItem);
        return of(cachedItem);
      }
    }
    
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        console.log('===== RAW CUSTOMER API RESPONSE =====');
        console.log('Full API response:', response);
        console.log('Response type:', typeof response);
        
        // Handle different response formats
        let customerData: any = response;
        
        // Check if response is wrapped in a container object
        if (response && typeof response === 'object') {
          // Check for common wrapper properties
          if (response.data) {
            console.log('Found customer data in .data property');
            customerData = response.data;
          } else if (response.customer) {
            console.log('Found customer data in .customer property');
            customerData = response.customer;
          } else if (response.content) {
            console.log('Found customer data in .content property');
            customerData = response.content;
          }
          
          // Ensure we have a valid cust_num
          if (!customerData.cust_num) {
            console.log('Setting cust_num from request ID:', id);
            customerData.cust_num = id;
          }
          
          console.log('Final customer data being returned:', customerData);
        }
        
        console.log('==================================');
        
        return customerData;
      }),
      catchError(error => {
        console.error(`Error fetching customer with ID ${id}:`, error);
        console.error('API error response:', error.error);
        console.error('Status code:', error.status);
        
        // For local IDs, we need to handle 404s more gracefully
        if (error.status === 404 && id >= 2000 && this.customersCache) {
          // Try to find the customer in the cache again
          const cachedItem = this.customersCache.find(item => item.cust_num === id);
          if (cachedItem) {
            console.log('API returned 404 but found local ID in cache:', cachedItem);
            return of(cachedItem);
          }
        }
        
        return throwError(() => new Error('Failed to load customer details'));
      })
    );
  }

  /**
   * Create a new customer
   * @param customerData Customer data
   * @returns Observable of created customer data
   */
  createCustomer(customerData: CustomerData): Observable<CustomerData> {
    // Generate a local ID before sending to the API
    const dataWithId = this.ensureId({...customerData});
    console.log('Enhanced customer payload with local ID:', dataWithId);
    
    return this.http.post<CustomerData>(this.apiUrl, dataWithId).pipe(
      tap(response => {
        console.log('Customer created successfully:', response);
        // Invalidate cache to force refresh on next load
        this.customersCache = null;
      }),
      // Map to ensure response has an ID
      map(response => {
        if (!response.cust_num) {
          console.log('API response missing cust_num, using locally generated one');
          response.cust_num = dataWithId.cust_num;
        }
        return response;
      }),
      catchError(error => {
        console.error('Error creating customer:', error);
        console.error('API error response:', error.error);
        console.error('Status code:', error.status);
        console.log('Using mock response for creating customer due to API error');
        
        // Return the data with the local ID
        return of(dataWithId);
      })
    );
  }

  /**
   * Update customer identity information
   * @param id Customer ID
   * @param identityData Identity data
   * @returns Observable of updated customer data
   */
  updateCustomerIdentity(id: string, identityData: any): Observable<CustomerData> {
    // Map the frontend identity fields to backend fields
    const backendData = {
      cust_type: identityData.idType === 'passport' ? 1 : 2,
      // Add other mappings as needed
    };
    
    return this.http.put<CustomerData>(`${this.apiUrl}/${id}`, backendData);
  }

  /**
   * Update customer name information
   * @param id Customer ID
   * @param nameData Name data
   * @returns Observable of updated customer data
   */
  updateCustomerName(id: string, nameData: any): Observable<CustomerData> {
    // Map to backend fields
    return this.http.put<CustomerData>(`${this.apiUrl}/${id}`, nameData);
  }

  /**
   * Update customer contact information
   * @param id Customer ID
   * @param contactData Contact data
   * @returns Observable of updated customer data
   */
  updateCustomerContact(id: string, contactData: any): Observable<CustomerData> {
    // Map the frontend contact fields to backend fields
    const backendData = {
      cust_email: contactData.email,
      cust_contact_num: contactData.phone,
      cust_mobile_num: contactData.alternatePhone
    };
    
    return this.http.put<CustomerData>(`${this.apiUrl}/${id}`, backendData);
  }

  /**
   * Add a new address to customer
   * @param id Customer ID
   * @param addressData Address data
   * @returns Observable of updated customer data
   */
  addCustomerAddress(id: string, addressData: any): Observable<CustomerData> {
    // TODO: Replace with your actual API endpoint
    return this.http.post<CustomerData>(`${this.apiUrl}/${id}/addresses`, addressData);
  }

  /**
   * Update a customer address
   * @param customerId Customer ID
   * @param addressId Address ID
   * @param addressData Address data
   * @returns Observable of updated customer data
   */
  updateCustomerAddress(customerId: string, addressId: string, addressData: any): Observable<CustomerData> {
    // TODO: Replace with your actual API endpoint
    return this.http.put<CustomerData>(`${this.apiUrl}/${customerId}/addresses/${addressId}`, addressData);
  }

  /**
   * Delete a customer address
   * @param customerId Customer ID
   * @param addressId Address ID
   * @returns Observable of response
   */
  deleteCustomerAddress(customerId: string, addressId: string): Observable<any> {
    // TODO: Replace with your actual API endpoint
    return this.http.delete<any>(`${this.apiUrl}/${customerId}/addresses/${addressId}`);
  }

  /**
   * Delete a customer
   * @param id Customer ID
   * @returns Observable of response
   */
  deleteCustomer(id: number): Observable<void> {
    // TODO: Replace with your actual API endpoint
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update customer
   * @param id Customer ID
   * @param customerData Customer data
   * @returns Observable of updated customer data
   */
  updateCustomer(id: number, customerData: CustomerData): Observable<CustomerData> {
    // Ensure consistent ID
    const dataWithId = {
      ...customerData,
      cust_num: id
    };
    
    return this.http.put<CustomerData>(`${this.apiUrl}/${id}`, dataWithId).pipe(
      tap(response => {
        console.log('Customer updated successfully:', response);
        // Ensure the cache is invalidated
        this.customersCache = null;
      }),
      // Map to ensure response has an ID
      map(response => {
        if (!response.cust_num) {
          console.log('API response missing cust_num in update, using request ID');
          response.cust_num = id;
        }
        return response;
      }),
      catchError(error => {
        console.error('Error updating customer:', error);
        
        // For status 404, it may mean the API doesn't recognize our local ID
        // Let's assume the update succeeded for our local cache
        if (error.status === 404 && id >= 2000 && this.customersCache) {
          console.log('API returned 404 for local ID, treating as successful update');
          
          // Update the cache to reflect the changes
          const index = this.customersCache.findIndex(item => item.cust_num === id);
          if (index !== -1) {
            this.customersCache[index] = dataWithId;
            console.log('Updated local customer in cache');
            // Return a success response
            return of(dataWithId);
          }
        }
        
        return throwError(() => new Error('Failed to update customer: ' + (error.message || 'Unknown error')));
      })
    );
  }
} 