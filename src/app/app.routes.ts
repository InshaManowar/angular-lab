import { Routes } from '@angular/router';
import { CustomerNameComponent } from './pages/customer-name/customer-name.component';
import { CustomerIdentityComponent } from './pages/customer-identity/customer-identity.component';
import { CustomerContactComponent } from './pages/customer-contact/customer-contact.component';
import { CustomerListComponent } from './pages/customer-list/customer-list.component';
import { CustomerDetailComponent } from './pages/customer-detail/customer-detail.component';
import { CustomerEditComponent } from './pages/customer-edit/customer-edit.component';
import { CustomerAddressComponent } from './pages/customer-address/customer-address.component';

export const routes: Routes = [
  { path: '', redirectTo: '/customer-list', pathMatch: 'full' },
  { path: 'customer-list', component: CustomerListComponent },
  { path: 'customer-detail/:id', component: CustomerDetailComponent },
  { path: 'customer-edit/:id', component: CustomerEditComponent },
  { path: 'customer-address', component: CustomerAddressComponent },
  { path: 'customer-name', component: CustomerNameComponent },
  { path: 'customer-identity', component: CustomerIdentityComponent },
  { path: 'customer-contact', component: CustomerContactComponent },
  { path: '**', redirectTo: '/customer-list' }
];
