import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { SessionTodayComponent } from './session-today.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

describe('SessionTodayComponent', () => {
  let component: SessionTodayComponent;
  let fixture: ComponentFixture<SessionTodayComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // Create mock services
    mockApiService = jasmine.createSpyObj('ApiService', [
      'createTodaySession',
      'finalizeAndCompleteSession',
      'downloadReport',
      'uploadPhoto',
      'updateTodayTaskStatus',
      'refreshDataSilently',
      'canFinalizeSession',
      'todaySessionTasks'
    ]);

    mockAuthService = jasmine.createSpyObj('AuthService', ['user']);

    // Set up mock return values
    mockApiService.todaySession = {
      value: signal(null),
      isLoading: signal(false)
    } as any;

    mockApiService.assignedTasks = {
      isLoading: signal(false)
    } as any;

    mockApiService.todaySessionTasks.and.returnValue([]);
    mockApiService.canFinalizeSession.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [SessionTodayComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SessionTodayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display loading state', () => {
    // Set loading state
    mockApiService.todaySession.isLoading.set(true);
    fixture.detectChanges();

    const loadingElements = fixture.nativeElement.querySelectorAll('.skeleton');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should format date correctly', () => {
    const testDate = '2023-12-01';
    const formattedDate = component.formatDate(testDate);
    expect(formattedDate).toContain('2023');
    expect(typeof formattedDate).toBe('string');
  });

  it('should format time correctly', () => {
    const testTimestamp = '2023-12-01T10:30:00Z';
    const formattedTime = component.formatTime(testTimestamp);
    expect(typeof formattedTime).toBe('string');
    expect(formattedTime).toMatch(/\d{2}:\d{2}/);
  });

  it('should return correct status colors', () => {
    expect(component.getStatusColor('done')).toBe('#10B981');
    expect(component.getStatusColor('in_progress')).toBe('#3B82F6');
    expect(component.getStatusColor('todo')).toBe('#9CA3AF');
    expect(component.getStatusColor('blocked')).toBe('#EF4444');
  });

  it('should return correct status labels', () => {
    expect(component.getStatusLabel('done')).toBe('Terminé');
    expect(component.getStatusLabel('in_progress')).toBe('En cours');
    expect(component.getStatusLabel('todo')).toBe('À faire');
    expect(component.getStatusLabel('blocked')).toBe('Bloqué');
  });

  it('should return correct room status classes', () => {
    expect(component.getRoomStatusClass(100)).toBe('room-completed');
    expect(component.getRoomStatusClass(50)).toBe('room-in-progress');
    expect(component.getRoomStatusClass(0)).toBe('room-pending');
  });

  it('should return correct room status icons', () => {
    expect(component.getRoomStatusIcon(100)).toBe('✅');
    expect(component.getRoomStatusIcon(50)).toBe('🔄');
    expect(component.getRoomStatusIcon(0)).toBe('⏳');
  });

  it('should open task modal correctly', () => {
    const mockTask = {
      id: 'test-1',
      assignedTask: {
        task_template: { name: 'Test Task' },
        room: { id: 'room-1', name: 'Test Room' },
        room_id: 'room-1'
      },
      status: 'todo' as const,
      performed_by: 'Test User',
      notes: 'Test notes'
    };

    component.openTaskModal(mockTask);

    const modal = component.taskModal();
    expect(modal.isOpen).toBe(true);
    expect(modal.task).toBe(mockTask);
    expect(modal.status).toBe('todo');
    expect(modal.performer).toBe('Test User');
    expect(modal.notes).toBe('Test notes');
  });

  it('should close task modal correctly', () => {
    component.closeTaskModal();

    const modal = component.taskModal();
    expect(modal.isOpen).toBe(false);
    expect(modal.task).toBe(null);
    expect(modal.status).toBe('todo');
    expect(modal.performer).toBe('');
    expect(modal.notes).toBe('');
    expect(modal.photos).toEqual([]);
  });

  it('should call createTodaySession when button is clicked', async () => {
    mockApiService.createTodaySession.and.returnValue(Promise.resolve());

    await component.createTodaySession();

    expect(mockApiService.createTodaySession).toHaveBeenCalled();
  });

  it('should not create session if already creating', async () => {
    component.creatingSession.set(true);
    mockApiService.createTodaySession.and.returnValue(Promise.resolve());

    await component.createTodaySession();

    expect(mockApiService.createTodaySession).not.toHaveBeenCalled();
  });
});