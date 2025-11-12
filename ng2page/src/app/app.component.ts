import { Component } from '@angular/core';

import { ScaffoldingService, IdentityInfo } from './scaffolding.service';

/**
 * Root component for the Scaffolding Plugin Angular application.
 *
 * Provides a simple interface for retrieving and displaying identity information.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  identityName: string | null = null;
  identityInfo: IdentityInfo | null = null;
  loading = false;
  error: string | null = null;

  constructor(private scaffoldingService: ScaffoldingService) {
  }

  /**
   * Retrieves identity information based on the entered identity name.
   * Displays loading state and handles errors appropriately.
   */
  getInfo(): void {
    if (!this.identityName || this.identityName.trim().length === 0) {
      this.error = 'Please enter an identity name';
      return;
    }

    // Reset state
    this.identityInfo = null;
    this.error = null;
    this.loading = true;

    this.scaffoldingService.getIdentityInfo(this.identityName).subscribe({
      next: (info: IdentityInfo) => {
        this.identityInfo = info;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
        console.error('Failed to fetch identity info:', err);
      }
    });
  }
}
