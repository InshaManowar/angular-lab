import { Routes } from '@angular/router';
import { CustomerNameComponent } from './pages/customer-name/customer-name.component';
import { CustomerIdentityComponent } from './pages/customer-identity/customer-identity.component';
import { CustomerContactComponent } from './pages/customer-contact/customer-contact.component';
import { CustomerListComponent } from './pages/customer-list/customer-list.component';
import { CustomerDetailComponent } from './pages/customer-detail/customer-detail.component';
import { CustomerEditComponent } from './pages/customer-edit/customer-edit.component';
import { CustomerAddressComponent } from './pages/customer-address/customer-address.component';
import { IdentificationDetailComponent } from './pages/identification-detail/identification-detail.component';
import { IdentificationEditComponent } from './pages/identification-edit/identification-edit.component';

export const routes: Routes = [
  { path: '', redirectTo: 'customer-list', pathMatch: 'full' },
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
  },
  {
    path: 'customer-edit/:id',
    loadComponent: () =>
      import('./pages/customer-edit/customer-edit.component').then(
        (m) => m.CustomerEditComponent
      ),
  },
  { path: 'customer-name', component: CustomerNameComponent },
  { path: 'customer-identity', component: CustomerIdentityComponent },
  { path: 'customer-contact', component: CustomerContactComponent },
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
  },
  {
    path: 'contact-edit/:id',
    loadComponent: () =>
      import('./pages/contact-edit/contact-edit.component').then(
        (m) => m.ContactEditComponent
      ),
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
    component: IdentificationDetailComponent
  },
  {
    path: 'identification-edit/:id',
    component: IdentificationEditComponent
  },
  {
    path: 'proof-of-id-list',
    loadComponent: () =>
      import('./pages/proof-of-id-list/proof-of-id-list.component').then(
        (m) => m.ProofOfIdListComponent
      ),
  },
  {
    path: 'proof-of-id-add',
    loadComponent: () =>
      import('./pages/proof-of-id-add/proof-of-id-add.component').then(
        (m) => m.ProofOfIdAddComponent
      ),
  },
  {
    path: 'proof-of-id-detail/:id',
    loadComponent: () =>
      import('./pages/proof-of-id-detail/proof-of-id-detail.component').then(
        (m) => m.ProofOfIdDetailComponent
      ),
  },
  {
    path: 'proof-of-id-edit/:id',
    loadComponent: () =>
      import('./pages/proof-of-id-edit/proof-of-id-edit.component').then(
        (m) => m.ProofOfIdEditComponent
      ),
  },
  { path: '**', redirectTo: '/customer-list' }
];
