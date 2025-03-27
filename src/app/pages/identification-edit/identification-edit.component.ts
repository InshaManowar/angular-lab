import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerIdentificationService, CustomerIdentification } from '../../services/customer-identification.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-identification-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './identification-edit.component.html',
  styleUrl: './identification-edit.component.css'
})
export class IdentificationEditComponent implements OnInit {
  identificationForm!: FormGroup;
  identificationId!: number;
  originalIdentification?: CustomerIdentification;
  loading: boolean = false;
  error: string | null = null;
  
  // Common ID types
  idTypes = [
    { id: 1, name: 'Passport' },
    { id: 2, name: 'Driver\'s License' },
    { id: 3, name: 'National ID' },
    { id: 4, name: 'Social Security' },
    { id: 5, name: 'Birth Certificate' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private identificationService: CustomerIdentificationService
  ) {
    this.identificationForm = this.fb.group({
      cust_id_type: [null, Validators.required],
      cust_id_item: ['', Validators.required],
      cust_efctv_dt: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('IdentificationEditComponent initialized');
    
    this.route.paramMap.subscribe(params => {
      console.log('Route parameters received:', params);
      const idParam = params.get('id');
      console.log('ID parameter from route:', idParam);
      
      if (!idParam) {
        this.error = 'Missing identification ID';
        return;
      }
      
      this.identificationId = +idParam;
      console.log('Converted ID to number:', this.identificationId);
      
      if (isNaN(this.identificationId) || this.identificationId <= 0) {
        this.error = 'Invalid identification ID';
        return;
      }
      
      this.loadIdentificationData();
    });
  }

  loadIdentificationData(): void {
    console.log(`Loading identification data for ID: ${this.identificationId}`);
    this.loading = true;
    this.identificationService.getIdentificationById(this.identificationId)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (data) => {
          console.log('Loaded identification data:', data);
          this.originalIdentification = data;
          
          // Double-check the ID received from the API
          if (data.cust_id) {
            console.log(`API returned cust_id: ${data.cust_id}, using this for update operations`);
            // Update the component's ID if the API returned one
            if (data.cust_id !== this.identificationId) {
              console.log(`Note: API ID (${data.cust_id}) differs from route ID (${this.identificationId})`);
            }
          } else {
            console.warn('API response does not contain cust_id, will use ID from route');
            // If API response doesn't have an ID, add the route ID to the original data
            this.originalIdentification = {
              ...this.originalIdentification,
              cust_id: this.identificationId
            };
          }
          
          this.initForm();
        },
        error: (error) => {
          console.error('Error loading identification:', error);
          this.error = `Failed to load identification: ${error.message}`;
        }
      });
  }

  initForm(): void {
    if (!this.originalIdentification) {
      this.error = 'No identification data available';
      return;
    }
    
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return '';
      // Handle different date formats and convert to YYYY-MM-DD for input[type=date]
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
      }
    };
    
    this.identificationForm.setValue({
      cust_id_type: this.originalIdentification.cust_id_type || null,
      cust_id_item: this.originalIdentification.cust_id_item || '',
      cust_efctv_dt: formatDate(this.originalIdentification.cust_efctv_dt)
    });
  }

  resetForm(): void {
    if (this.originalIdentification) {
      const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        } catch (error) {
          console.error('Error formatting date:', error);
          return dateString;
        }
      };
      
      // Reset to original values with proper type handling
      console.log('Resetting form to original values:', this.originalIdentification);
      console.log('Original cust_id_type:', typeof this.originalIdentification.cust_id_type, this.originalIdentification.cust_id_type);
      
      this.identificationForm.setValue({
        cust_id_type: this.originalIdentification.cust_id_type || null,
        cust_id_item: this.originalIdentification.cust_id_item || '',
        cust_efctv_dt: formatDate(this.originalIdentification.cust_efctv_dt)
      });
    }
  }

  onSubmit(): void {
    if (this.identificationForm.valid) {
      this.loading = true;
      this.error = null;
      
      // Ensure we have a valid ID
      if (!this.identificationId || isNaN(this.identificationId)) {
        console.error('Invalid identification ID for update:', this.identificationId);
        this.error = 'Cannot update: Invalid identification ID';
        this.loading = false;
        return;
      }
      
      // Use the cust_id from originalIdentification if available, otherwise use identificationId from route
      const idToUse = this.originalIdentification?.cust_id || this.identificationId;
      
      // Get form values and ensure proper type conversion
      const formValues = this.identificationForm.getRawValue();
      
      // Create the updated identification object with proper types
      const updatedIdentification: CustomerIdentification = {
        ...this.originalIdentification,
        cust_id: idToUse,
        cust_id_type: formValues.cust_id_type ? Number(formValues.cust_id_type) : undefined,
        cust_id_item: formValues.cust_id_item,
        cust_efctv_dt: formValues.cust_efctv_dt
      };
      
      console.log('Submitting updated identification data:', updatedIdentification);
      console.log('Using ID for update:', idToUse);
      console.log('cust_id_type:', typeof updatedIdentification.cust_id_type, updatedIdentification.cust_id_type);
      
      this.identificationService.updateIdentification(idToUse, updatedIdentification)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: response => {
            console.log('Identification updated successfully');
            this.router.navigate(['/identification-detail', idToUse]);
          },
          error: error => {
            console.error('Error updating identification:', error);
            this.error = `Failed to update identification: ${error.message || 'Unknown error'}`;
          }
        });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.identificationForm.controls).forEach(key => {
        const control = this.identificationForm.get(key);
        control?.markAsTouched();
      });
    }
  }
} 