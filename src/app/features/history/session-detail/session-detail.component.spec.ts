import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SessionDetailComponent } from './session-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { of } from 'rxjs';

describe('SessionDetailComponent', () => {
  let component: SessionDetailComponent;
  let fixture: ComponentFixture<SessionDetailComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getSession',
      'getSessionLogs',
      'getSessionStatistics',
      'exportSessionToPdf'
    ]);

    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      paramMap: of(new Map([['sessionId', 'test-session-id']]))
    });

    await TestBed.configureTestingModule({
      imports: [SessionDetailComponent],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SessionDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with loading state', () => {
    expect(component.isLoading()).toBeFalsy();
    expect(component.sessionDetail()).toBeNull();
  });

  it('should format date correctly', () => {
    const testDate = '2024-01-15T10:30:00Z';
    const formattedDate = component.formatDate(testDate);
    expect(formattedDate).toContain('janvier');
    expect(formattedDate).toContain('2024');
  });

  it('should format time correctly', () => {
    const testTime = '2024-01-15T14:30:00Z';
    const formattedTime = component.formatTime(testTime);
    expect(formattedTime).toMatch(/\d{2}:\d{2}/);
  });

  it('should calculate progress percentage correctly', () => {
    const mockSession = {
      completed_tasks: 8,
      total_tasks: 10,
      logs: [],
      performers: [],
      photos: [],
      notes: []
    } as any;

    const percentage = component.getProgressPercentage(mockSession);
    expect(percentage).toBe(80);
  });

  it('should return 0 progress when no total tasks', () => {
    const mockSession = {
      completed_tasks: 0,
      total_tasks: 0,
      logs: [],
      performers: [],
      photos: [],
      notes: []
    } as any;

    const percentage = component.getProgressPercentage(mockSession);
    expect(percentage).toBe(0);
  });

  it('should get correct status label', () => {
    expect(component.getStatusLabel('completed')).toBe('Terminée');
    expect(component.getStatusLabel('in_progress')).toBe('En cours');
    expect(component.getStatusLabel('done')).toBe('Terminé');
    expect(component.getStatusLabel('unknown')).toBe('unknown');
  });

  it('should get correct status badge class', () => {
    expect(component.getStatusBadgeClass('completed')).toBe('badge-success');
    expect(component.getStatusBadgeClass('in_progress')).toBe('badge-primary');
    expect(component.getStatusBadgeClass('blocked')).toBe('badge-danger');
    expect(component.getStatusBadgeClass('unknown')).toBe('badge-gray');
  });

  it('should get initials correctly', () => {
    expect(component.getInitials('Jean Dupont')).toBe('JD');
    expect(component.getInitials('Marie-Claire Martin')).toBe('MM');
    expect(component.getInitials('Pierre')).toBe('P');
  });

  it('should open and close photo modal', () => {
    const photoUrl = 'http://example.com/photo.jpg';

    component.openPhotoModal(photoUrl);
    expect(component.selectedPhoto()).toBe(photoUrl);

    component.closePhotoModal();
    expect(component.selectedPhoto()).toBeNull();
  });

  it('should show and hide export modal', () => {
    component.showExportModal();
    expect(component.showingExportModal()).toBeTruthy();

    component.hideExportModal();
    expect(component.showingExportModal()).toBeFalsy();
  });
});