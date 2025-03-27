import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerIdentificationService, CustomerIdentification } from '../../services/customer-identification.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-identification-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './identification-list.component.html',
  styleUrl: './identification-list.component.css'
})
export class IdentificationListComponent implements OnInit {
  identifications: CustomerIdentification[] = [];
  filteredIdentifications: CustomerIdentification[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  error: boolean = false;

  constructor(
    private router: Router,
    private identificationService: CustomerIdentificationService
  ) {}

  ngOnInit(): void {
    this.loadIdentifications();
  }

  loadIdentifications(): void {
    this.loading = true;
    this.error = false;
    
    this.identificationService.getAllIdentifications()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (data) => {
          console.log('API Response Data:', data);
          this.identifications = data;
          this.filteredIdentifications = [...data];
        },
        error: (error) => {
          console.error('Error loading identifications:', error);
          this.error = true;
        }
      });
  }

  filterIdentifications(): void {
    if (!this.searchTerm) {
      this.filteredIdentifications = [...this.identifications];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredIdentifications = this.identifications.filter(identification => 
        identification.cust_id_item?.toLowerCase().includes(term) || 
        this.getIdentificationTypeLabel(identification.cust_id_type).toLowerCase().includes(term) ||
        identification.cust_id?.toString().includes(term)
      );
    }
  }

  navigateToIdentificationDetail(identification: CustomerIdentification): void {
    if (!identification.cust_id) {
      console.error('Cannot navigate: Identification ID is missing');
      return;
    }
    
    console.log('Navigating to identification detail with ID:', identification.cust_id);
    this.router.navigate(['identification-detail', identification.cust_id]);
  }

  navigateToIdentificationEdit(identification: CustomerIdentification): void {
    if (!identification.cust_id) {
      console.error('Cannot navigate: Identification ID is missing');
      return;
    }
    
    console.log('Navigating to identification edit with ID:', identification.cust_id);
    this.router.navigate(['identification-edit', identification.cust_id]);
  }

  getIdentificationTypeLabel(type?: number): string {
    return this.identificationService.getIdentificationTypeLabel(type);
  }
} 