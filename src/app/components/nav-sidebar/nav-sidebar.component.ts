import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-sidebar.component.html',
  styleUrls: ['./nav-sidebar.component.css']
})
export class NavSidebarComponent implements OnInit {
  // Add a version identifier
  componentVersion = 'v2.0-no-customer-name-identity';
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  ngOnInit(): void {
    console.log('NavSidebarComponent initialized, version:', this.componentVersion);
    // Force change detection
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('Change detection forced');
    }, 100);
  }
} 