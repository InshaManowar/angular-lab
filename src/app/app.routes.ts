import { Routes } from '@angular/router';
import { CustomerListComponent } from './pages/customer-list/customer-list.component';
import { CustomerDetailComponent } from './pages/customer-detail/customer-detail.component';
import { CustomerEditComponent } from './pages/customer-edit/customer-edit.component';
import { CustomerAddressComponent } from './pages/customer-address/customer-address.component';
import { IdentificationDetailComponent } from './pages/identification-detail/identification-detail.component';
import { IdentificationEditComponent } from './pages/identification-edit/identification-edit.component';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  {
    path: 'landing',
    loadComponent: () =>
      import('./pages/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },
  {
    path: 'customer-list',
    loadComponent: () =>
      import('./pages/customer-list/customer-list.component').then(
        (m) => m.CustomerListComponent
      ),
  },
  {
    path: 'customer-address',
    loadComponent: () =>
      import('./pages/customer-address/customer-address.component').then(
        (m) => m.CustomerAddressComponent
      ),
  },
  {
    path: 'customer-detail/:id',
    loadComponent: () =>
      import('./pages/customer-detail/customer-detail.component').then(
        (m) => m.CustomerDetailComponent
      ),
    data: { renderMode: 'client' }
  },
  {
    path: 'customer-edit/:id',
    loadComponent: () =>
      import('./pages/customer-edit/customer-edit.component').then(
        (m) => m.CustomerEditComponent
      ),
    data: { renderMode: 'client' }
  },
  { path: 'customer-name', redirectTo: 'customer-list', pathMatch: 'full' },
  { path: 'customer-identity', redirectTo: 'customer-list', pathMatch: 'full' },
  {
    path: 'contact-list',
    loadComponent: () =>
      import('./pages/contact-list/contact-list.component').then(
        (m) => m.ContactListComponent
      ),
  },
  {
    path: 'contact-add',
    loadComponent: () =>
      import('./pages/contact-add/contact-add.component').then(
        (m) => m.ContactAddComponent
      ),
  },
  {
    path: 'contact-detail/:id',
    loadComponent: () =>
      import('./pages/contact-detail/contact-detail.component').then(
        (m) => m.ContactDetailComponent
      ),
    data: { renderMode: 'client' }
  },
  {
    path: 'contact-edit/:id',
    loadComponent: () =>
      import('./pages/contact-edit/contact-edit.component').then(
        (m) => m.ContactEditComponent
      ),
    data: { renderMode: 'client' }
  },
  {
    path: 'identification-list',
    loadComponent: () =>
      import('./pages/identification-list/identification-list.component').then(
        (m) => m.IdentificationListComponent
      ),
  },
  {
    path: 'identification-add',
    loadComponent: () =>
      import('./pages/identification-add/identification-add.component').then(
        (m) => m.IdentificationAddComponent
      ),
  },
  {
    path: 'identification-detail/:id',
    component: IdentificationDetailComponent,
    data: { renderMode: 'client' }
  },
  {
    path: 'identification-edit/:id',
    component: IdentificationEditComponent,
    data: { renderMode: 'client' }
  },
  { path: '**', redirectTo: '/landing' }
];
