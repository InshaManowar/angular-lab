import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Define routes that should NOT be prerendered (routes with parameters)
const dynamicRoutes = [
  '/customer-detail/:id',
  '/customer-edit/:id',
  '/contact-detail/:id',
  '/contact-edit/:id',
  '/identification-detail/:id',
  '/identification-edit/:id',
];

// Check if a route is dynamic (contains parameters)
function isDynamicRoute(route: string): boolean {
  return dynamicRoutes.some(pattern => {
    // Convert pattern to regex
    const regexPattern = pattern.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(route);
  });
}

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as `necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  // Skip prerendering for dynamic routes
  const options = isDynamicRoute(req.path) ? { disablePrerender: true } : {};
  
  angularApp
    .handle(req, options)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
