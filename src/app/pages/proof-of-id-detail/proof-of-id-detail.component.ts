import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerProofOfIdService, CustomerProofOfId } from '../../services/customer-proof-of-id.service';
import { catchError, finalize, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-proof-of-id-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './proof-of-id-detail.component.html',
  styleUrl: './proof-of-id-detail.component.css'
})
export class ProofOfIdDetailComponent implements OnInit {
  proof: CustomerProofOfId | null = null;
  proofId!: number;
  loading: boolean = false;
  errorMessage: string | null = null;
  isLocalId: boolean = false;
  retryCount: number = 0;
  Object = Object; // Make Object available in the template

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private proofService: CustomerProofOfIdService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) {
        this.errorMessage = 'No ID parameter provided';
        return;
      }

      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        this.errorMessage = 'Invalid ID parameter';
        return;
      }

      this.proofId = id;
      this.isLocalId = id >= 4000; // Check if it's a locally generated ID
      this.loadProofDetails();
    });
  }

  loadProofDetails(): void {
    this.loading = true;
    this.errorMessage = null;
    
    console.log(`Loading proof of ID details for ID: ${this.proofId}`);
    
    this.proofService.getProofById(this.proofId)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        catchError(error => {
          console.error('Error loading proof details:', error);
          
          // For locally generated IDs, try to find the proof in the complete list
          if (this.isLocalId && this.retryCount === 0) {
            this.retryCount++;
            console.log('Local ID not found directly, will retry with all proofs');
            return this.retryWithAllProofs();
          }
          
          this.errorMessage = `Failed to load proof details: ${error.message || 'Unknown error'}`;
          return of(null);
        })
      )
      .subscribe(result => {
        if (result) {
          this.proof = result;
          console.log('Loaded proof details:', this.proof);
        } else if (!this.errorMessage) {
          this.errorMessage = 'No proof found with the provided ID';
        }
      });
  }

  retryWithAllProofs(): Observable<CustomerProofOfId | null> {
    console.log('Fetching all proofs to find local ID:', this.proofId);
    
    return this.proofService.getAllProofs().pipe(
      map((proofs: CustomerProofOfId[]) => {
        const foundProof = proofs.find((p: CustomerProofOfId) => p.cust_id === this.proofId);
        
        if (foundProof) {
          console.log('Found proof in all proofs list:', foundProof);
          return foundProof;
        }
        
        console.log('Proof not found in complete list, creating placeholder');
        // Create a placeholder for the UI
        return {
          cust_id: this.proofId,
          proof_type_id: 1,
          proof_value: 'Not available or still processing',
          cust_efctv_dt: new Date().toISOString()
        };
      }),
      catchError(error => {
        console.error('Error fetching all proofs:', error);
        this.errorMessage = 'Failed to load proof details: Could not retrieve proof data';
        return of(null);
      })
    );
  }

  editProof(): void {
    this.router.navigate(['/proof-of-id-edit', this.proofId]);
  }

  getProofTypeLabel(type?: number): string {
    return this.proofService.getProofTypeLabel(type);
  }

  goToList(): void {
    this.router.navigate(['/proof-of-id-list']);
  }
} 