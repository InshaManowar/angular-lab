import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerIdentificationService, CustomerIdentification } from '../../services/customer-identification.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-identification-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './identification-detail.component.html',
  styleUrl: './identification-detail.component.css'
})
export class IdentificationDetailComponent implements OnInit {
  identification: CustomerIdentification | null = null;
  identificationId!: number;
  loading: boolean = false;
  errorMessage: string | null = null;
  isLocalId: boolean = false;
  retryCount: number = 0;
  Object = Object; // Make Object available in the template

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private identificationService: CustomerIdentificationService
  ) {}

  ngOnInit(): void {
    console.log('IdentificationDetailComponent initialized');
    this.route.paramMap.subscribe(
      params => {
        console.log('Route params:', params);
        const idParam = params.get('id');
        console.log('ID from route params:', idParam);
        
        if (!idParam) {
          console.error('No ID parameter found in route');
          this.errorMessage = 'No identification ID provided';
          this.loading = false;
          return;
        }
        
        // Convert to number and check validity
        this.identificationId = +idParam;
        
        if (isNaN(this.identificationId) || this.identificationId <= 0) {
          console.error('Invalid ID parameter:', idParam);
          this.errorMessage = 'Invalid identification ID provided';
          this.loading = false;
          return;
        }
        
        // Check if this is a locally generated ID (1000+)
        this.isLocalId = this.identificationId >= 1000;
        if (this.isLocalId) {
          console.log('This is a locally generated ID, may not exist in backend:', this.identificationId);
        }
        
        console.log(`Loading identification details for ID: ${this.identificationId}`);
        this.loadIdentificationDetails();
      },
      error => {
        console.error('Error extracting route parameters:', error);
        this.errorMessage = 'Error loading identification details';
        this.loading = false;
      }
    );
  }

  loadIdentificationDetails(): void {
    this.loading = true;
    this.errorMessage = null;
    console.log(`Calling identificationService.getIdentificationById(${this.identificationId})`);
    
    this.identificationService.getIdentificationById(this.identificationId).subscribe({
      next: (data) => {
        console.log('Identification data received:', data);
        this.identification = data;
        this.loading = false;
        
        if (!this.identification) {
          console.error('Identification data is null or undefined');
          this.errorMessage = 'Identification details not found';
        } else if (typeof this.identification !== 'object') {
          console.error('Unexpected identification data type:', typeof this.identification);
          this.errorMessage = 'Invalid identification data format';
        } else {
          // Ensure the component's ID matches the response ID if present
          if (this.identification.cust_id && this.identification.cust_id !== this.identificationId) {
            console.log(`Updating component ID from ${this.identificationId} to match response: ${this.identification.cust_id}`);
            this.identificationId = this.identification.cust_id;
          }
          
          // If response doesn't have an ID, add it
          if (!this.identification.cust_id) {
            console.log('Adding ID to identification response:', this.identificationId);
            this.identification.cust_id = this.identificationId;
          }
          
          console.log('Identification loaded successfully:', this.identification);
        }
      },
      error: (error) => {
        console.error('Error fetching identification details:', error);
        this.errorMessage = error.message || 'Failed to load identification details';
        this.loading = false;
        
        // For local IDs, we can retry with getAllIdentifications
        if (this.isLocalId && this.retryCount < 1) {
          this.retryCount++;
          console.log(`Retrying with getAllIdentifications for local ID: ${this.identificationId}`);
          this.retryWithAllIdentifications();
        }
      }
    });
  }
  
  retryWithAllIdentifications(): void {
    this.loading = true;
    this.errorMessage = null;
    
    this.identificationService.getAllIdentifications().subscribe({
      next: (identifications) => {
        const found = identifications.find(item => item.cust_id === this.identificationId);
        if (found) {
          console.log('Found identification in complete list:', found);
          this.identification = found;
          this.loading = false;
        } else if (this.isLocalId) {
          // Create a placeholder for local IDs
          console.log('Creating placeholder for local ID:', this.identificationId);
          this.identification = {
            cust_id: this.identificationId,
            cust_id_type: 1, // Default type
            cust_id_item: 'Loading...',
            cust_efctv_dt: new Date().toISOString()
          };
          this.loading = false;
          this.errorMessage = 'This identification record may be still processing';
        } else {
          this.loading = false;
          this.errorMessage = 'Identification details not found';
        }
      },
      error: (error) => {
        console.error('Error fetching all identifications:', error);
        this.loading = false;
        this.errorMessage = 'Failed to load identification details';
      }
    });
  }

  editIdentification(): void {
    console.log('Navigating to edit identification with ID:', this.identificationId);
    this.router.navigate(['identification-edit', this.identificationId]);
  }

  getIdentificationTypeLabel(type?: number): string {
    return this.identificationService.getIdentificationTypeLabel(type);
  }
  
  goToList(): void {
    this.router.navigate(['/identification-list']);
  }
} 