import { HttpInterceptorFn } from '@angular/common/http';

declare var PluginHelper: any;

/**
 * HTTP interceptor function for adding CSRF token to requests.
 *
 * This interceptor adds the X-XSRF-TOKEN header to all HTTP requests
 * for CSRF protection. In development mode, it can also add Basic Auth
 * if configured via PluginHelper.
 *
 * @param req - The outgoing HTTP request
 * @param next - The next interceptor in the chain
 * @returns Observable of the HTTP event
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  // Development hook - use Basic Auth if available
  if (PluginHelper.getBasicAuth) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', PluginHelper.getBasicAuth())
    });
    return next(authReq);
  }

  // Clone the request to add the CSRF token header
  const csrfReq = req.clone({
    headers: req.headers.set('X-XSRF-TOKEN', PluginHelper.getCsrfToken())
  });

  // Pass on the cloned request instead of the original request
  return next(csrfReq);
};
