import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';

// Merge the existing appConfig providers with the HTTP client provider
const providers = [...appConfig.providers, provideHttpClient()];

bootstrapApplication(AppComponent, {
  providers
}).catch((err) => console.error(err));
