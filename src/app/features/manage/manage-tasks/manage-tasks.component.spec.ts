import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';

import { ManageTasksComponent } from './manage-tasks.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { TaskService } from '../../tasks/task.service';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal.component';

describe('ManageTasksComponent', () => {
  let component: ManageTasksComponent;
  let fixture: ComponentFixture<ManageTasksComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockTaskService: jasmine.SpyObj<TaskService>;

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'createTaskTemplate',
      'updateTaskTemplate',
      'deleteTaskTemplate'
    ], {
      taskTemplates: { value: () => [], isLoading: () => false, reload: () => {} },
      assignedTasks: { value: () => [], isLoading: () => false, reload: () => {} },
      rooms: { value: () => [], isLoading: () => false, reload: () => {} }
    });

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser'], {
      user: () => ({ uid: 'test-user', email: 'test@example.com' })
    });

    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['loadAllData']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        ManageTasksComponent,
        ConfirmationModalComponent
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TaskService, useValue: taskServiceSpy }
      ]
    }).compileComponents();

    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;

    fixture = TestBed.createComponent(ManageTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.openMenuId()).toBeNull();
    expect(component.savingTemplate()).toBeFalse();
    expect(component.searchQuery()).toBe('');
    expect(component.templateModal().isOpen).toBeFalse();
    expect(component.deleteTemplateModal().isOpen).toBeFalse();
  });

  it('should open template modal in create mode', () => {
    component.openTemplateModal('create');

    expect(component.templateModal().isOpen).toBeTrue();
    expect(component.templateModal().mode).toBe('create');
    expect(component.templateModal().template).toBeNull();
  });

  it('should open template modal in edit mode with template data', () => {
    const mockTemplate = {
      id: '1',
      name: 'Test Task',
      description: 'Test Description',
      category: 'Test Category',
      estimated_duration: 30,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    component.openTemplateModal('edit', mockTemplate);

    expect(component.templateModal().isOpen).toBeTrue();
    expect(component.templateModal().mode).toBe('edit');
    expect(component.templateModal().template).toBe(mockTemplate);
    expect(component.templateForm.get('name')?.value).toBe('Test Task');
    expect(component.templateForm.get('description')?.value).toBe('Test Description');
    expect(component.templateForm.get('category')?.value).toBe('Test Category');
    expect(component.templateForm.get('estimated_duration')?.value).toBe(30);
  });

  it('should close template modal and reset form', () => {
    component.openTemplateModal('create');
    component.templateForm.patchValue({ name: 'Test' });

    component.closeTemplateModal();

    expect(component.templateModal().isOpen).toBeFalse();
    expect(component.templateForm.get('name')?.value).toBe('');
  });

  it('should toggle template menu', () => {
    const templateId = 'test-id';

    // Open menu
    component.toggleTemplateMenu(templateId);
    expect(component.openMenuId()).toBe(templateId);

    // Close menu
    component.toggleTemplateMenu(templateId);
    expect(component.openMenuId()).toBeNull();
  });

  it('should update search query', () => {
    const event = new Event('input');
    const target = document.createElement('input');
    target.value = 'test search';
    Object.defineProperty(event, 'target', { value: target });

    component.updateSearchQuery(event);

    expect(component.searchQuery()).toBe('test search');
  });

  it('should reset template filters', () => {
    component.templateFilters.set({ category: 'test-category' });
    component.searchQuery.set('test-search');

    component.resetTemplateFilters();

    expect(component.templateFilters().category).toBe('');
    expect(component.searchQuery()).toBe('');
  });

  it('should validate form is invalid when required fields are missing', () => {
    expect(component.templateForm.invalid).toBeTrue();

    component.templateForm.patchValue({
      name: 'Test Task',
      category: 'Test Category',
      estimated_duration: 15
    });

    expect(component.templateForm.invalid).toBeFalse();
  });

  it('should handle duplicate template correctly', () => {
    const mockTemplate = {
      id: '1',
      name: 'Original Task',
      description: 'Original Description',
      category: 'Original Category',
      estimated_duration: 20,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    component.duplicateTemplate(mockTemplate);

    expect(component.templateForm.get('name')?.value).toBe('Original Task (copie)');
    expect(component.templateForm.get('description')?.value).toBe('Original Description');
    expect(component.templateForm.get('category')?.value).toBe('Original Category');
    expect(component.templateForm.get('estimated_duration')?.value).toBe(20);
    expect(component.templateModal().isOpen).toBeTrue();
    expect(component.templateModal().mode).toBe('create');
    expect(component.openMenuId()).toBeNull();
  });
});