import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading, withViewTransitions } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

// Update routes to disable prerendering for routes with parameters
const routesWithClientRendering = routes.map(route => {
  // If the route path contains a parameter (indicated by ':')
  if (route.path && route.path.includes(':')) {
    return {
      ...route,
      data: { ...route.data, renderMode: 'client' }
    };
  }
  return route;
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routesWithClientRendering, 
      withViewTransitions(),
      withPreloading(PreloadAllModules)
    ),
    provideHttpClient(withFetch()),
    provideClientHydration()
  ]
};
