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

  constructor(private http: HttpClient) { }

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
        
        // Ensure each customer has a cust_num
        customers = customers.map((customer: any, index: number) => {
          // If cust_num is missing, assign a value starting from 15
          if (customer.cust_num === undefined) {
            customer.cust_num = 15 + index; // Start from 15 and increment for each customer
            console.log(`Assigned cust_num ${customer.cust_num} to customer:`, customer.cust_full_name);
          }
          return customer;
        });
        
        console.log('Processed customer data:', customers);
        return customers;
      }),
      tap(customers => {
        this.customersCache = customers;
        this.lastFetchTime = Date.now();
      }),
      catchError(error => {
        console.error('Error fetching customers:', error);
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
          
          // Set cust_num from the request ID if it's missing
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
    // Clear the cache so the list will be refreshed on next load
    this.customersCache = null;
    
    // Get the current timestamp as a unique identifier if cust_num is not set
    if (customerData.cust_num === undefined) {
      // Generate a number starting from 15 plus the current timestamp's last 3 digits
      const timestamp = Date.now();
      customerData.cust_num = 15 + (timestamp % 1000);
      console.log('Generated cust_num for new customer:', customerData.cust_num);
    }
    
    return this.http.post<CustomerData>(this.apiUrl, customerData).pipe(
      tap(response => {
        console.log('Customer created successfully:', response);
        // Ensure the cache is invalidated
        this.customersCache = null;
      }),
      catchError(error => {
        console.error('Error creating customer:', error);
        return throwError(() => new Error('Failed to create customer: ' + (error.message || 'Unknown error')));
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
    // Clear the cache so the list will be refreshed on next load
    this.customersCache = null;
    
    return this.http.put<CustomerData>(`${this.apiUrl}/${id}`, customerData).pipe(
      tap(response => {
        console.log('Customer updated successfully:', response);
        // Ensure the cache is invalidated
        this.customersCache = null;
      }),
      catchError(error => {
        console.error('Error updating customer:', error);
        return throwError(() => new Error('Failed to update customer: ' + (error.message || 'Unknown error')));
      })
    );
  }
} 