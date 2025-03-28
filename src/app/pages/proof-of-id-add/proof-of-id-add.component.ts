import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerProofOfIdService } from '../../services/customer-proof-of-id.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-proof-of-id-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './proof-of-id-add.component.html',
  styleUrl: './proof-of-id-add.component.css'
})
export class ProofOfIdAddComponent implements OnInit {
  proofForm: FormGroup;
  loading: boolean = false;
  error: string | null = null;
  
  // Supported proof types
  proofTypes = [
    { id: 1, name: 'Passport' },
    { id: 2, name: 'Driver\'s License' },
    { id: 3, name: 'National ID' },
    { id: 4, name: 'Social Security' },
    { id: 5, name: 'Birth Certificate' },
    { id: 6, name: 'Voter ID' },
    { id: 7, name: 'Utility Bill' },
    { id: 8, name: 'Bank Statement' }
  ];
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private proofService: CustomerProofOfIdService
  ) {
    this.proofForm = this.fb.group({
      proof_type_id: [null, Validators.required],
      proof_value: ['', Validators.required],
      cust_efctv_dt: [this.formatDateForInput(new Date()), Validators.required],
      end_date: ['']
    });
  }
  
  ngOnInit(): void {
    // Form is initialized in constructor
  }
  
  onSubmit(): void {
    if (this.proofForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    // Prepare the data
    const proofData = this.proofForm.value;
    
    this.proofService.createProof(proofData)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Proof created successfully:', response);
          
          // Add a slight delay to allow any backend processing to complete
          setTimeout(() => {
            // Navigate to the detail view if we have an ID
            if (response.cust_id) {
              this.router.navigate(['/proof-of-id-detail', response.cust_id]);
            } else {
              // Otherwise go to list
              this.router.navigate(['/proof-of-id-list']);
            }
          }, 100);
        },
        error: (error) => {
          console.error('Error creating proof of ID:', error);
          this.error = 'Failed to create proof of ID. Please try again.';
        }
      });
  }
  
  saveAndAddAnother(): void {
    if (this.proofForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    const proofData = this.proofForm.value;
    
    this.proofService.createProof(proofData)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Proof created successfully:', response);
          
          // Reset the form for a new entry
          this.proofForm.reset({
            proof_type_id: null,
            proof_value: '',
            cust_efctv_dt: this.formatDateForInput(new Date()),
            end_date: ''
          });
        },
        error: (error) => {
          console.error('Error creating proof of ID:', error);
          this.error = 'Failed to create proof of ID. Please try again.';
        }
      });
  }
  
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}