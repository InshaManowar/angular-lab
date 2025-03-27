import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerIdentificationService } from '../../services/customer-identification.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-identification-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './identification-add.component.html',
  styleUrl: './identification-add.component.css'
})
export class IdentificationAddComponent implements OnInit {
  identificationForm: FormGroup;
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
    private router: Router,
    private identificationService: CustomerIdentificationService
  ) {
    this.identificationForm = this.fb.group({
      cust_id_type: [null, Validators.required],
      cust_id_item: ['', Validators.required],
      cust_efctv_dt: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.identificationForm.valid) {
      this.loading = true;
      this.error = null;
      
      // Ensure proper conversion of cust_id_type to a number
      const formValues = this.identificationForm.getRawValue();
      const submitData = {
        ...formValues,
        cust_id_type: formValues.cust_id_type ? Number(formValues.cust_id_type) : undefined
      };
      
      console.log('Submitting new identification data:', submitData);
      
      this.identificationService.createIdentification(submitData)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: response => {
            console.log('Identification created successfully:', response);
            
            // If the response has an ID, navigate to the detail page for that ID
            if (response && response.cust_id) {
              console.log(`Navigating to detail view for new ID: ${response.cust_id}`);
              
              // Small delay to allow any backend processing to complete
              setTimeout(() => {
                this.router.navigate(['/identification-detail', response.cust_id]);
              }, 200);
            } else {
              // Otherwise, just navigate to the list view
              console.log('No ID received in response, navigating to list view');
              this.router.navigate(['/identification-list']);
            }
          },
          error: error => {
            console.error('Error creating identification:', error);
            this.error = `Failed to create identification: ${error.message || 'Unknown error'}`;
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

  saveAndAddAnother(): void {
    if (this.identificationForm.valid) {
      this.loading = true;
      this.error = null;
      
      // Ensure proper conversion of cust_id_type to a number
      const formValues = this.identificationForm.getRawValue();
      const submitData = {
        ...formValues,
        cust_id_type: formValues.cust_id_type ? Number(formValues.cust_id_type) : undefined
      };
      
      console.log('Submitting new identification data:', submitData);
      
      this.identificationService.createIdentification(submitData)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: response => {
            console.log('Identification created successfully:', response);
            // Reset form for another entry
            this.identificationForm.reset({
              cust_id_type: null,
              cust_efctv_dt: new Date().toISOString().split('T')[0]
            });
            // Show success message with ID if available
            if (response && response.cust_id) {
              alert(`Identification document created successfully with ID: ${response.cust_id}`);
            } else {
              alert('Identification document created successfully!');
            }
          },
          error: error => {
            console.error('Error creating identification:', error);
            this.error = `Failed to create identification: ${error.message || 'Unknown error'}`;
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