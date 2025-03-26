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
        
        // Generate a unique ID for each customer if it doesn't have one
        customers = customers.map((customer: any, index: number) => {
          // If cust_num is missing, generate a unique ID
          if (customer.cust_num === undefined) {
            // Try to create a deterministic ID based on other fields if possible
            const emailPart = customer.cust_email ? 
                              customer.cust_email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') : '';
            const namePart = customer.cust_full_name ? 
                              customer.cust_full_name.substring(0, 3).replace(/[^a-zA-Z0-9]/g, '') : '';
            
            // Use array index + 1 as a base for the ID to ensure uniqueness
            customer.cust_num = (index + 1);
            
            // If we have email or name, use them to create a more meaningful ID
            if (emailPart || namePart) {
              customer.display_id = `${namePart}${emailPart}${index + 1}`;
            }
            
            console.log(`Generated ID for customer "${customer.cust_full_name}": ${customer.cust_num}`);
          }
          return customer;
        });
        
        console.log('Processed customer data with IDs:', customers);
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
          
          // Log the extracted customer data
          console.log('Extracted customer data:', customerData);
          
          // Check for ID fields and ensure cust_num is set
          const idFields = ['id', 'customerId', 'customer_id', '_id'];
          if (!customerData.cust_num) {
            // Try to get ID from alternative fields
            for (const field of idFields) {
              if (customerData[field] !== undefined) {
                console.log(`Using ${field} as cust_num:`, customerData[field]);
                customerData.cust_num = customerData[field];
                break;
              }
            }
            
            // If we still don't have a cust_num, use the ID from the request
            if (!customerData.cust_num) {
              console.log('Setting cust_num from request ID:', id);
              customerData.cust_num = id;
            }
          }
        }
        
        console.log('Final customer data being returned:', customerData);
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
    // TODO: Replace with your actual API endpoint
    return this.http.post<CustomerData>(this.apiUrl, customerData);
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
    // TODO: Replace with your actual API endpoint
    return this.http.put<CustomerData>(`${this.apiUrl}/${id}`, customerData);
  }
} 