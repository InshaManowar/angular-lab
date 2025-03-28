import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withViewTransitions, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withViewTransitions(),
      withPreloading(PreloadAllModules),
      withEnabledBlockingInitialNavigation()
    ),
    provideHttpClient(withFetch())
  ]
};
