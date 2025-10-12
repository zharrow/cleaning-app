import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { EnterpriseService } from '../../../core/services/enterprise.service';
import { signal } from '@angular/core';

// Mock services
class MockAuthService {
  isLoading = signal(false);
}

class MockApiService {
  isLoading = signal(false);
  todaySessionTasks = signal([]);
  refreshData = jasmine.createSpy('refreshData');
}

class MockEnterpriseService {
  enterpriseName = signal('Test Enterprise');
  enterpriseLogo = signal('');
  loadEnterpriseData = jasmine.createSpy('loadEnterpriseData').and.returnValue(Promise.resolve());
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockApiService: MockApiService;
  let mockAuthService: MockAuthService;
  let mockEnterpriseService: MockEnterpriseService;

  beforeEach(async () => {
    mockApiService = new MockApiService();
    mockAuthService = new MockAuthService();
    mockEnterpriseService = new MockEnterpriseService();

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ApiService, useValue: mockApiService },
        { provide: EnterpriseService, useValue: mockEnterpriseService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display enterprise name', () => {
    mockEnterpriseService.enterpriseName.set('Test Company');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.enterprise-name')?.textContent).toContain('Test Company');
  });

  it('should display default name when no enterprise name is provided', () => {
    mockEnterpriseService.enterpriseName.set('');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.enterprise-name')?.textContent).toContain('Micro-Crèche');
  });

  it('should calculate progress stats correctly with no tasks', () => {
    mockApiService.todaySessionTasks.set([]);
    fixture.detectChanges();

    const stats = component.progressStats();
    expect(stats.total).toBe(0);
    expect(stats.percentage).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.inProgress).toBe(0);
    expect(stats.blocked).toBe(0);
  });

  it('should calculate progress stats correctly with tasks', () => {
    const mockTasks = [
      { id: 1, status: 'done' },
      { id: 2, status: 'todo' },
      { id: 3, status: 'in_progress' },
      { id: 4, status: 'blocked' }
    ];
    mockApiService.todaySessionTasks.set(mockTasks);
    fixture.detectChanges();

    const stats = component.progressStats();
    expect(stats.total).toBe(4);
    expect(stats.completed).toBe(1);
    expect(stats.todo).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.blocked).toBe(1);
    expect(stats.percentage).toBe(25); // 1/4 * 100
  });

  it('should show online status when not syncing', () => {
    mockApiService.isLoading.set(false);
    mockAuthService.isLoading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.status-indicator.online')).toBeTruthy();
    expect(compiled.querySelector('.status-indicator.syncing')).toBeFalsy();
  });

  it('should show syncing status when loading', () => {
    mockApiService.isLoading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.status-indicator.syncing')).toBeTruthy();
    expect(compiled.querySelector('.status-indicator.online')).toBeFalsy();
  });

  it('should toggle action menu', () => {
    expect(component.actionMenuOpen()).toBe(false);

    component.toggleActionMenu();
    expect(component.actionMenuOpen()).toBe(true);

    component.toggleActionMenu();
    expect(component.actionMenuOpen()).toBe(false);
  });

  it('should refresh data when refresh button is clicked', async () => {
    const refreshButton = fixture.nativeElement.querySelector('.control-button');

    expect(component.refreshing()).toBe(false);

    refreshButton.click();

    expect(component.refreshing()).toBe(true);
    expect(mockApiService.refreshData).toHaveBeenCalled();

    // Wait for the refresh to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    expect(component.refreshing()).toBe(false);
  });

  it('should handle logo error', () => {
    const mockEvent = {
      target: { src: 'invalid-url.jpg' } as HTMLImageElement
    } as Event;

    spyOn(console, 'warn');
    component.onLogoError(mockEvent);

    expect(console.warn).toHaveBeenCalledWith('Erreur lors du chargement du logo:', 'invalid-url.jpg');
  });

  it('should calculate circumference correctly', () => {
    const expectedCircumference = 2 * Math.PI * 16;
    expect(component.circumference()).toBe(expectedCircumference);
  });

  it('should calculate dash offset correctly', () => {
    // Mock 50% completion
    const mockTasks = [
      { id: 1, status: 'done' },
      { id: 2, status: 'todo' }
    ];
    mockApiService.todaySessionTasks.set(mockTasks);
    fixture.detectChanges();

    const circumference = component.circumference();
    const expectedOffset = circumference - (50 / 100) * circumference;

    expect(component.dashOffset()).toBe(expectedOffset);
  });
});