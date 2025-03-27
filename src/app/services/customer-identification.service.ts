import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

/**
 * Customer Identification interface that maps to the Java entity
 */
export interface CustomerIdentification {
  // ID fields
  cust_id?: number;
  
  // Identification type
  cust_id_type?: number;
  
  // Identification value
  cust_id_item?: string;
  
  // Date fields
  cust_efctv_dt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerIdentificationService {
  private apiUrl = 'http://localhost:8020/api/customeridentification';
  private identificationsCache: CustomerIdentification[] | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  constructor(private http: HttpClient) { }

  /**
   * Get all customer identifications
   * @returns Observable of customer identification data array
   */
  getAllIdentifications(): Observable<CustomerIdentification[]> {
    const currentTime = Date.now();
    if (this.identificationsCache && (currentTime - this.lastFetchTime < this.CACHE_DURATION)) {
      console.log('Using cached identification data:', this.identificationsCache);
      return of(this.identificationsCache);
    }
    
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => {
        console.log('Raw Identification API response:', response);
      }),
      map(response => {
        // Check if response is an array or an object with content property
        let identifications = Array.isArray(response) ? response : (response.content || []);
        
        console.log('Processed identification data:', identifications);
        return identifications;
      }),
      tap(identifications => {
        this.identificationsCache = identifications;
        this.lastFetchTime = Date.now();
      }),
      catchError(error => {
        console.error('Error fetching identifications:', error);
        console.log('Using mock data for identifications due to API error');
        // Return mock data when API fails
        const mockData = this.getMockIdentificationData();
        this.identificationsCache = mockData;
        this.lastFetchTime = Date.now();
        return of(mockData);
      })
    );
  }

  /**
   * Get an identification by ID
   * @param id Identification ID
   * @returns Observable of identification data
   */
  getIdentificationById(id: number): Observable<CustomerIdentification> {
    console.log(`Making API request to: ${this.apiUrl}/cust_id/${id}`);
    
    // Check if id is valid
    if (isNaN(id) || id <= 0) {
      console.error('Invalid identification ID:', id);
      return throwError(() => new Error('Invalid identification ID'));
    }
    
    return this.http.get<any>(`${this.apiUrl}/cust_id/${id}`).pipe(
      tap(response => {
        console.log('===== RAW IDENTIFICATION API RESPONSE =====');
        console.log('Full API response:', response);
        console.log('Response type:', typeof response);
      }),
      map(response => {
        // Handle different response formats
        let identificationData: any = response;
        
        // Check if response is wrapped in a container object
        if (response && typeof response === 'object') {
          // Check for common wrapper properties
          if (response.data) {
            console.log('Found identification data in .data property');
            identificationData = response.data;
          } else if (response.identification) {
            console.log('Found identification data in .identification property');
            identificationData = response.identification;
          } else if (response.content) {
            console.log('Found identification data in .content property');
            identificationData = response.content;
          }
        }
        
        console.log('Final identification data being returned:', identificationData);
        
        // Ensure we have a valid cust_id field
        if (!identificationData.cust_id && id) {
          console.log('Setting cust_id from request ID:', id);
          identificationData.cust_id = id;
        }
        
        console.log('==================================');
        
        return identificationData;
      }),
      catchError(error => {
        console.error(`Error fetching identification with ID ${id}:`, error);
        console.error('API error response:', error.error);
        console.error('Status code:', error.status);
        console.log('Using mock data for single identification due to API error');
        
        // Find the mock identification with the matching ID
        const mockIdentifications = this.getMockIdentificationData();
        const mockIdentification = mockIdentifications.find(item => item.cust_id === id);
        
        if (mockIdentification) {
          return of(mockIdentification);
        } else {
          return throwError(() => new Error('Failed to load identification details: ID not found'));
        }
      })
    );
  }

  /**
   * Create a new identification
   * @param identificationData Identification data
   * @returns Observable of created identification data
   */
  createIdentification(identificationData: CustomerIdentification): Observable<CustomerIdentification> {
    console.log('Making API request to create identification:', this.apiUrl);
    console.log('Create payload:', identificationData);
    
    return this.http.post<CustomerIdentification>(this.apiUrl, identificationData).pipe(
      tap(response => {
        console.log('Identification created successfully:', response);
        
        // Invalidate cache to force refresh on next load
        this.identificationsCache = null;
      }),
      catchError(error => {
        console.error('Error creating identification:', error);
        console.error('API error response:', error.error);
        console.error('Status code:', error.status);
        console.log('Using mock response for creating identification due to API error');
        
        // Create a mock response with a generated ID
        const mockResponse: CustomerIdentification = {
          ...identificationData,
          cust_id: Math.floor(Math.random() * 1000) + 100 // Generate random ID between 100-1100
        };
        
        console.log('Generated mock identification response:', mockResponse);
        
        // Add to mock data if we're using mocks
        if (this.identificationsCache) {
          this.identificationsCache.push(mockResponse);
        }
        
        return of(mockResponse);
      })
    );
  }

  /**
   * Updates an existing identification
   * @param id Identification ID
   * @param identification Updated identification data
   * @returns Observable of the API response
   */
  updateIdentification(id: number, identification: CustomerIdentification): Observable<any> {
    // Validate ID before making API call
    if (isNaN(id) || id <= 0) {
      console.error('Invalid identification ID for update:', id);
      return throwError(() => new Error('Cannot update identification: Invalid ID'));
    }
    
    console.log(`Making API request to update identification: ${this.apiUrl}/cust_id/${id}`);
    console.log('Update payload:', identification);
    
    // Ensure the cust_id in the payload matches the ID parameter
    const payloadWithId: CustomerIdentification = {
      ...identification,
      cust_id: id // Ensure consistent ID
    };
    
    return this.http.put<any>(`${this.apiUrl}/cust_id/${id}`, payloadWithId).pipe(
      tap(response => {
        console.log('Identification update successful:', response);
        
        // Update cache if present
        if (this.identificationsCache) {
          const index = this.identificationsCache.findIndex(item => item.cust_id === id);
          if (index !== -1) {
            this.identificationsCache[index] = payloadWithId;
            console.log('Updated identification in cache');
          }
        }
      }),
      catchError(error => {
        console.error(`Error updating identification with ID ${id}:`, error);
        console.error('API error response:', error.error);
        console.error('Status code:', error.status);
        return throwError(() => new Error(`Failed to update identification: ${error.message || 'Server error'}`));
      })
    );
  }

  /**
   * Deletes an identification
   * @param id Identification ID
   * @returns Observable of the API response
   */
  deleteIdentification(id: number): Observable<any> {
    // Validate ID before making API call
    if (isNaN(id) || id <= 0) {
      console.error('Invalid identification ID for deletion:', id);
      return throwError(() => new Error('Cannot delete identification: Invalid ID'));
    }
    
    console.log(`Making API request to delete identification: ${this.apiUrl}/cust_id/${id}`);
    
    return this.http.delete<any>(`${this.apiUrl}/cust_id/${id}`).pipe(
      tap(response => {
        console.log('Identification deletion successful:', response);
        
        // Update cache if present
        if (this.identificationsCache) {
          this.identificationsCache = this.identificationsCache.filter(item => item.cust_id !== id);
          console.log('Removed identification from cache');
        }
      }),
      catchError(error => {
        console.error(`Error deleting identification with ID ${id}:`, error);
        console.error('API error response:', error.error);
        console.error('Status code:', error.status);
        return throwError(() => new Error(`Failed to delete identification: ${error.message || 'Server error'}`));
      })
    );
  }

  /**
   * Get identification type label
   */
  getIdentificationTypeLabel(type?: number): string {
    switch(type) {
      case 1: return 'Passport';
      case 2: return 'Driver\'s License';
      case 3: return 'National ID';
      case 4: return 'Social Security';
      case 5: return 'Birth Certificate';
      default: return type?.toString() || 'Unknown';
    }
  }

  /**
   * Generate mock identification data for testing
   * @returns Array of mock identification data
   */
  private getMockIdentificationData(): CustomerIdentification[] {
    return [
      {
        cust_id: 1,
        cust_id_type: 1,
        cust_id_item: 'P12345678',
        cust_efctv_dt: new Date().toISOString()
      },
      {
        cust_id: 2,
        cust_id_type: 2,
        cust_id_item: 'DL98765432',
        cust_efctv_dt: new Date().toISOString()
      },
      {
        cust_id: 3,
        cust_id_type: 3,
        cust_id_item: 'NID123456789',
        cust_efctv_dt: new Date().toISOString()
      },
      {
        cust_id: 4,
        cust_id_type: 4,
        cust_id_item: 'SSN123-45-6789',
        cust_efctv_dt: new Date().toISOString()
      },
      {
        cust_id: 5,
        cust_id_type: 5,
        cust_id_item: 'BC98765432',
        cust_efctv_dt: new Date().toISOString()
      }
    ];
  }
} 