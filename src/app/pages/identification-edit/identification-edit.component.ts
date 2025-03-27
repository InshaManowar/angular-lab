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
      cust_id_type: ['', Validators.required],
      cust_id_item: ['', Validators.required],
      cust_efctv_dt: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      
      if (!idParam) {
        this.error = 'Missing identification ID';
        return;
      }
      
      this.identificationId = +idParam;
      
      if (isNaN(this.identificationId) || this.identificationId <= 0) {
        this.error = 'Invalid identification ID';
        return;
      }
      
      this.loadIdentificationData();
    });
  }

  loadIdentificationData(): void {
    this.loading = true;
    this.identificationService.getIdentificationById(this.identificationId)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (data) => {
          console.log('Loaded identification data:', data);
          this.originalIdentification = data;
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
      cust_id_type: this.originalIdentification.cust_id_type || '',
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
      
      this.identificationForm.setValue({
        cust_id_type: this.originalIdentification.cust_id_type || '',
        cust_id_item: this.originalIdentification.cust_id_item || '',
        cust_efctv_dt: formatDate(this.originalIdentification.cust_efctv_dt)
      });
    }
  }

  onSubmit(): void {
    if (this.identificationForm.valid) {
      this.loading = true;
      this.error = null;
      
      const updatedIdentification: CustomerIdentification = {
        ...this.originalIdentification,
        ...this.identificationForm.value
      };
      
      console.log('Submitting updated identification data:', updatedIdentification);
      
      this.identificationService.updateIdentification(this.identificationId, updatedIdentification)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: response => {
            console.log('Identification updated successfully');
            this.router.navigate(['/identification-detail', this.identificationId]);
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