import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../../tasks/task.service';
import { ManagePerformersComponent } from './manage-performers.component';

describe('ManagePerformersComponent', () => {
  let component: ManagePerformersComponent;
  let fixture: ComponentFixture<ManagePerformersComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'loadAllData',
      'createPerformer',
      'updatePerformer',
      'deletePerformer',
      'togglePerformerStatus'
    ]);

    await TestBed.configureTestingModule({
      imports: [ManagePerformersComponent, ReactiveFormsModule],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManagePerformersComponent);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isSubmitting()).toBeFalse();
    expect(component.openMenuId()).toBeNull();
    expect(component.performerModal().isOpen).toBeFalse();
  });

  it('should call loadAllData on init', () => {
    component.ngOnInit();
    expect(mockTaskService.loadAllData).toHaveBeenCalled();
  });

  it('should open performer modal in create mode', () => {
    component.openPerformerModal('create');

    const modal = component.performerModal();
    expect(modal.isOpen).toBeTrue();
    expect(modal.mode).toBe('create');
    expect(modal.performer).toBeNull();
  });

  it('should close performer modal and reset form', () => {
    component.openPerformerModal('create');
    component.closePerformerModal();

    const modal = component.performerModal();
    expect(modal.isOpen).toBeFalse();
    expect(modal.mode).toBe('create');
    expect(modal.performer).toBeNull();
  });

  it('should toggle performer menu', () => {
    const performerId = 'test-id';

    component.togglePerformerMenu(performerId);
    expect(component.openMenuId()).toBe(performerId);

    component.togglePerformerMenu(performerId);
    expect(component.openMenuId()).toBeNull();
  });

  it('should format date correctly', () => {
    const testDate = '2023-12-25T10:30:00Z';
    const formatted = component.formatDate(testDate);

    // Check that it returns a valid French date format
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('should validate form correctly', () => {
    const form = component.performerForm;

    // Empty form should be invalid
    expect(form.valid).toBeFalse();

    // Form with valid name should be valid
    form.patchValue({ name: 'Test Performer' });
    expect(form.valid).toBeTrue();

    // Form with too short name should be invalid
    form.patchValue({ name: 'A' });
    expect(form.valid).toBeFalse();
  });
});