import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerProofOfIdService, CustomerProofOfId } from '../../services/customer-proof-of-id.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-proof-of-id-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './proof-of-id-list.component.html',
  styleUrl: './proof-of-id-list.component.css'
})
export class ProofOfIdListComponent implements OnInit {
  proofs: CustomerProofOfId[] = [];
  filteredProofs: CustomerProofOfId[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  error: boolean = false;

  constructor(
    private router: Router,
    private proofService: CustomerProofOfIdService
  ) {}

  ngOnInit(): void {
    this.loadProofs();
  }

  loadProofs(): void {
    this.loading = true;
    this.error = false;
    
    this.proofService.getAllProofs()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (data) => {
          console.log('API Response Data:', data);
          this.proofs = data;
          this.filteredProofs = [...data];
        },
        error: (error) => {
          console.error('Error loading proofs of ID:', error);
          this.error = true;
        }
      });
  }

  filterProofs(): void {
    if (!this.searchTerm) {
      this.filteredProofs = [...this.proofs];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredProofs = this.proofs.filter(proof => 
        proof.proof_value?.toLowerCase().includes(term) || 
        this.getProofTypeLabel(proof.proof_type_id).toLowerCase().includes(term) ||
        proof.cust_id?.toString().includes(term)
      );
    }
  }

  navigateToProofDetail(proof: CustomerProofOfId): void {
    if (!proof.cust_id) {
      console.error('Cannot navigate: Proof ID is missing');
      return;
    }
    
    console.log('Navigating to proof detail with ID:', proof.cust_id);
    this.router.navigate(['proof-of-id-detail', proof.cust_id]);
  }

  navigateToProofEdit(proof: CustomerProofOfId): void {
    if (!proof.cust_id) {
      console.error('Cannot navigate: Proof ID is missing');
      return;
    }
    
    console.log('Navigating to proof edit with ID:', proof.cust_id);
    this.router.navigate(['proof-of-id-edit', proof.cust_id]);
  }

  getProofTypeLabel(type?: number): string {
    return this.proofService.getProofTypeLabel(type);
  }
} 