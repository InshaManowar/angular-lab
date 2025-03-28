import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerProofOfIdService, CustomerProofOfId } from '../../services/customer-proof-of-id.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-proof-of-id-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './proof-of-id-edit.component.html',
  styleUrl: './proof-of-id-edit.component.css'
})
export class ProofOfIdEditComponent implements OnInit {
  proofForm!: FormGroup;
  proofId!: number;
  originalProof?: CustomerProofOfId;
  loading: boolean = false;
  error: string | null = null;
  Object = Object; // Make Object available in the template
  
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
    private route: ActivatedRoute,
    private router: Router,
    private proofService: CustomerProofOfIdService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) {
        this.error = 'No ID parameter provided';
        return;
      }
      
      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        this.error = 'Invalid ID parameter';
        return;
      }
      
      this.proofId = id;
      this.loadProofData();
    });
  }
  
  initForm(): void {
    this.proofForm = this.fb.group({
      proof_type_id: [null, Validators.required],
      proof_value: ['', Validators.required],
      cust_efctv_dt: ['', Validators.required],
      end_date: ['']
    });
  }
  
  loadProofData(): void {
    this.loading = true;
    this.error = null;
    
    this.proofService.getProofById(this.proofId)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (proof) => {
          this.originalProof = proof;
          
          // Format dates for the form
          const formatDate = (dateString: string | undefined) => {
            if (!dateString) return '';
            try {
              const date = new Date(dateString);
              return date.toISOString().split('T')[0];
            } catch (e) {
              return '';
            }
          };
          
          this.proofForm.patchValue({
            proof_type_id: proof.proof_type_id || null,
            proof_value: proof.proof_value || '',
            cust_efctv_dt: formatDate(proof.cust_efctv_dt),
            end_date: formatDate(proof.end_date)
          });
          
          console.log('Loaded proof data into form:', this.proofForm.value);
        },
        error: (error) => {
          console.error('Error loading proof data:', error);
          this.error = 'Failed to load proof data. Please try again later.';
        }
      });
  }
  
  resetForm(): void {
    if (this.originalProof) {
      const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        } catch (e) {
          return '';
        }
      };
      
      this.proofForm.patchValue({
        proof_type_id: this.originalProof.proof_type_id || null,
        proof_value: this.originalProof.proof_value || '',
        cust_efctv_dt: formatDate(this.originalProof.cust_efctv_dt),
        end_date: formatDate(this.originalProof.end_date)
      });
    }
  }
  
  onSubmit(): void {
    if (this.proofForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    const updatedData = this.proofForm.value;
    
    this.proofService.updateProof(this.proofId, updatedData)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Proof updated successfully:', response);
          this.router.navigate(['/proof-of-id-detail', this.proofId]);
        },
        error: (error) => {
          console.error('Error updating proof:', error);
          this.error = 'Failed to update proof. Please try again.';
        }
      });
  }
} 