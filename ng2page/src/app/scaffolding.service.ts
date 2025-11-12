import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

declare var PluginHelper: any;

/**
 * Interface representing identity information returned from the API
 */
export interface IdentityInfo {
  name: string;
  id: string;
  email: string;
}

/**
 * Service for retrieving identity information from SailPoint IIQ.
 *
 * This service communicates with the ScaffoldingPlugin REST API to fetch
 * identity details. Authentication is handled via HTTP interceptors.
 */
@Injectable({
  providedIn: 'root'
})
export class ScaffoldingService {
  private readonly baseUrl = PluginHelper.getPluginRestUrl('scaffolding');

  constructor(private http: HttpClient) { }

  /**
   * Retrieves identity information by identity name.
   *
   * @param identityName - The name of the identity to retrieve
   * @returns Observable of IdentityInfo containing name, ID, and email
   *
   * @example
   * ```typescript
   * this.scaffoldingService.getIdentityInfo('john.doe').subscribe({
   *   next: info => console.log(`Found: ${info.name}`),
   *   error: err => console.error('Error:', err)
   * });
   * ```
   */
  getIdentityInfo(identityName: string): Observable<IdentityInfo> {
    if (!identityName || identityName.trim().length === 0) {
      return throwError(() => new Error('Identity name is required'));
    }

    const url = `${this.baseUrl}/info/${encodeURIComponent(identityName.trim())}`;

    return this.http.get<IdentityInfo>(url).pipe(
      retry({ count: 1, delay: 1000 }), // Retry once after 1 second
      catchError(this.handleError)
    );
  }

  /**
   * Handles HTTP errors and transforms them into user-friendly messages.
   *
   * @param error - The HTTP error response
   * @returns Observable that errors immediately with formatted message
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
      console.error('Client-side error:', error.error);
    } else {
      // Backend returned an unsuccessful response code
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${JSON.stringify(error.error)}`
      );

      // Handle specific error codes
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid request';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to view this identity.';
          break;
        case 404:
          errorMessage = error.error?.message || 'Identity not found';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || `Error: ${error.status} ${error.statusText}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
