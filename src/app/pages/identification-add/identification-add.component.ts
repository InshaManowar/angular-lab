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
      cust_id_type: ['', Validators.required],
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
      
      console.log('Submitting new identification data:', this.identificationForm.value);
      
      this.identificationService.createIdentification(this.identificationForm.value)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: response => {
            console.log('Identification created successfully, navigating to list');
            // Navigate to identification list
            this.router.navigate(['/identification-list']);
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
      
      this.identificationService.createIdentification(this.identificationForm.value)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: response => {
            console.log('Identification created successfully, form reset for another');
            // Reset form for another entry
            this.identificationForm.reset({
              cust_id_type: '',
              cust_efctv_dt: new Date().toISOString().split('T')[0]
            });
            // Show success message
            alert('Identification document created successfully!');
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