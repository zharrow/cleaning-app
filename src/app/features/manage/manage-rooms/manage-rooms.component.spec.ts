import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { ManageRoomsComponent } from './manage-rooms.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal.component';

describe('ManageRoomsComponent', () => {
  let component: ManageRoomsComponent;
  let fixture: ComponentFixture<ManageRoomsComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // Create spy objects for services
    mockApiService = jasmine.createSpyObj('ApiService', [
      'createRoom',
      'updateRoom',
      'deleteRoom'
    ]);

    // Mock the rooms and assignedTasks signals
    mockApiService.rooms = {
      value: signal([]),
      isLoading: signal(false),
      reload: jasmine.createSpy('reload')
    } as any;

    mockApiService.assignedTasks = {
      value: signal([]),
      reload: jasmine.createSpy('reload')
    } as any;

    mockAuthService = jasmine.createSpyObj('AuthService', ['signOut']);
    mockAuthService.currentUser = signal(null);

    await TestBed.configureTestingModule({
      imports: [
        ManageRoomsComponent,
        ReactiveFormsModule,
        ConfirmationModalComponent
      ],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageRoomsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty rooms', () => {
    expect(component.rooms()).toEqual([]);
    expect(component.isLoading()).toBe(false);
  });

  it('should call API service reload methods on component initialization', () => {
    expect(mockApiService.rooms.reload).toHaveBeenCalled();
    expect(mockApiService.assignedTasks.reload).toHaveBeenCalled();
  });

  it('should open room modal in create mode', () => {
    component.openRoomModal('create');

    expect(component.roomModal().isOpen).toBe(true);
    expect(component.roomModal().mode).toBe('create');
    expect(component.roomModal().room).toBe(null);
  });

  it('should close room modal and reset form', () => {
    component.openRoomModal('create');
    component.closeRoomModal();

    expect(component.roomModal().isOpen).toBe(false);
    expect(component.roomModal().mode).toBe('create');
    expect(component.roomModal().room).toBe(null);
  });

  it('should calculate workload percentage correctly', () => {
    expect(component.getWorkloadPercentage(0)).toBe(0);
    expect(component.getWorkloadPercentage(45)).toBe(50); // 45/90 * 100 = 50%
    expect(component.getWorkloadPercentage(90)).toBe(100);
    expect(component.getWorkloadPercentage(180)).toBe(100); // Capped at 100%
  });

  it('should return correct workload labels', () => {
    expect(component.getWorkloadLabel(0)).toBe('Aucune tâche');
    expect(component.getWorkloadLabel(10)).toBe('Légère');
    expect(component.getWorkloadLabel(20)).toBe('Modérée');
    expect(component.getWorkloadLabel(45)).toBe('Importante');
    expect(component.getWorkloadLabel(90)).toBe('Très importante');
  });

  it('should return correct workload colors', () => {
    expect(component.getWorkloadColor(0)).toBe('text-gray-500');
    expect(component.getWorkloadColor(10)).toBe('text-success-600');
    expect(component.getWorkloadColor(20)).toBe('text-warning-600');
    expect(component.getWorkloadColor(45)).toBe('text-orange-600');
    expect(component.getWorkloadColor(90)).toBe('text-danger-600');
  });

  it('should validate room form correctly', () => {
    const form = component.roomForm;

    // Form should be invalid initially
    expect(form.invalid).toBe(true);

    // Set valid values
    form.patchValue({
      name: 'Test Room',
      description: 'Test Description',
      order: 1
    });

    expect(form.valid).toBe(true);
  });

  it('should require name field', () => {
    const nameControl = component.roomForm.get('name');
    expect(nameControl?.hasError('required')).toBe(true);

    nameControl?.setValue('Test Room');
    expect(nameControl?.hasError('required')).toBe(false);
  });

  it('should require order field to be positive', () => {
    const orderControl = component.roomForm.get('order');
    expect(orderControl?.hasError('required')).toBe(true);

    orderControl?.setValue(0);
    expect(orderControl?.hasError('min')).toBe(true);

    orderControl?.setValue(1);
    expect(orderControl?.valid).toBe(true);
  });

  it('should toggle room menu correctly', () => {
    const roomId = 'test-room-id';

    expect(component.openMenuId()).toBe(null);

    component.toggleRoomMenu(roomId);
    expect(component.openMenuId()).toBe(roomId);

    component.toggleRoomMenu(roomId);
    expect(component.openMenuId()).toBe(null);
  });

  it('should open reorder modal', () => {
    component.reorderRooms();
    expect(component.showReorderModal()).toBe(true);
  });

  it('should close reorder modal', () => {
    component.reorderRooms();
    component.closeReorderModal();
    expect(component.showReorderModal()).toBe(false);
  });
});