import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AppComponent } from './app.component';
import { ScaffoldingService } from './scaffolding.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    // Mock PluginHelper for testing
    (window as any).PluginHelper = {
      getPluginRestUrl: jasmine.createSpy('getPluginRestUrl').and.returnValue('/test/api'),
      getCsrfToken: jasmine.createSpy('getCsrfToken').and.returnValue('test-token')
    };

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [FormsModule],
      providers: [
        ScaffoldingService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have as title "app"', () => {
    expect(component.title).toEqual('app');
  });

  it('should render title in a h1 tag', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('IdentityIQ Scaffolding Plugin');
  });

  it('should initialize with null values', () => {
    expect(component.identityName).toBeNull();
    expect(component.identityInfo).toBeNull();
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('should set error when identity name is empty', () => {
    component.identityName = '';
    component.getInfo();
    expect(component.error).toBe('Please enter an identity name');
  });

  it('should set error when identity name is null', () => {
    component.identityName = null;
    component.getInfo();
    expect(component.error).toBe('Please enter an identity name');
  });

  it('should fetch identity info on valid input', () => {
    component.identityName = 'testuser';
    component.getInfo();

    expect(component.loading).toBeTrue();

    const req = httpMock.expectOne('/test/api/info/testuser');
    expect(req.request.method).toBe('GET');

    req.flush({
      name: 'testuser',
      id: '123',
      email: 'test@example.com'
    });

    expect(component.loading).toBeFalse();
    expect(component.identityInfo).toEqual({
      name: 'testuser',
      id: '123',
      email: 'test@example.com'
    });
    expect(component.error).toBeNull();
  });

  it('should handle error when fetching identity info fails', () => {
    component.identityName = 'nonexistent';
    component.getInfo();

    const req = httpMock.expectOne('/test/api/info/nonexistent');
    req.flush(
      { message: 'Identity not found' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(component.loading).toBeFalse();
    expect(component.identityInfo).toBeNull();
    expect(component.error).toBeTruthy();
  });

  it('should reset state before fetching new info', () => {
    component.identityInfo = {
      name: 'olduser',
      id: '999',
      email: 'old@example.com'
    };
    component.error = 'Previous error';

    component.identityName = 'newuser';
    component.getInfo();

    expect(component.identityInfo).toBeNull();
    expect(component.error).toBeNull();
  });
});
