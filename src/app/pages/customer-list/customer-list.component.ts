import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../services/customer.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css'
})
export class CustomerListComponent implements OnInit {
  customers: any[] = [];
  filteredCustomers: any[] = [];
  paginatedCustomers: any[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  error: boolean = false;
  
  // Pagination
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;

  constructor(
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = false;
    
    this.customerService.getAllCustomers()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (data) => {
          this.customers = data;
          this.filteredCustomers = [...data];
          this.updatePagination();
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.error = true;
        }
      });
  }

  filterCustomers(): void {
    if (!this.searchTerm) {
      this.filteredCustomers = [...this.customers];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCustomers = this.customers.filter(customer => 
        customer.cust_full_name?.toLowerCase().includes(term) || 
        customer.cust_email?.toLowerCase().includes(term) ||
        customer.cust_num?.toString().includes(term)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.pageSize);
    if (this.totalPages === 0) this.totalPages = 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredCustomers.length);
    this.paginatedCustomers = this.filteredCustomers.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(totalPagesToShow / 2));
    const endPage = Math.min(this.totalPages, startPage + totalPagesToShow - 1);
    
    if (endPage - startPage + 1 < totalPagesToShow) {
      startPage = Math.max(1, endPage - totalPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getCustomerTypeLabel(type: number): string {
    switch(type) {
      case 1: return 'Individual';
      case 2: return 'Business';
      case 3: return 'Government';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  deleteCustomer(id: number): void {
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          // Refresh the list
          this.loadCustomers();
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
        }
      });
    }
  }
} 