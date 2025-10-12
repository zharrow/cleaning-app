import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

// ==================== INTERFACES ====================

export interface Child {
  id: string;
  enterprise_id: string;
  last_name: string;
  first_name: string;
  birth_date: string;
  section: 'Babies' | 'Toddlers' | 'Preschoolers';
  allergies?: string;
  specific_diet?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Supplier {
  id: string;
  enterprise_id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  haccp_certified: boolean;
  validation_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  enterprise_id: string;
  supplier_id?: string;
  name: string;
  category?: string;
  allergens?: string;
  stock_unit?: string;
  current_stock?: number;
  expiry_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface Meal {
  id: string;
  enterprise_id: string;
  supplier_id?: string;
  batch_id?: string;
  responsible_id?: string;
  date: string;
  meal_type: 'Breakfast' | 'Lunch' | 'Snack';
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface Temperature {
  id: string;
  meal_id: string;
  responsible_id?: string;
  checkpoint: 'Reception' | 'Holding' | 'Service' | 'Storage';
  temperature: number;
  is_compliant: boolean;
  observations?: string;
  control_date: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  enterprise_id: string;
  name: string;
  type?: string;
  last_control_date?: string;
  target_temperature?: number;
  is_compliant: boolean;
  observations?: string;
  created_at: string;
  updated_at?: string;
}

export interface NonCompliance {
  id: string;
  enterprise_id: string;
  responsible_id?: string;
  type: 'Product' | 'Temperature' | 'Hygiene' | 'Other';
  description: string;
  report_date: string;
  corrective_action?: string;
  status: 'Open' | 'Corrected' | 'Closed';
  created_at: string;
  updated_at?: string;
}

export interface Document {
  id: string;
  enterprise_id: string;
  responsible_id?: string;
  name: string;
  category: 'Temperatures' | 'Cleaning' | 'Training' | 'Compliance' | 'Other';
  file_path: string;
  creation_date: string;
  retention_period?: string;
  created_at: string;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class HaccpService {
  private api = inject(ApiService);
  private readonly baseUrl = '/haccp';

  // ==================== CHILDREN ====================

  getChildren(isActive?: boolean): Observable<Child[]> {
    const params = isActive !== undefined ? { is_active: isActive } : {};
    return this.api.get<Child[]>(`${this.baseUrl}/children`, params);
  }

  getChild(id: string): Observable<Child> {
    return this.api.get<Child>(`${this.baseUrl}/children/${id}`);
  }

  createChild(child: Partial<Child>): Observable<Child> {
    return this.api.post<Child>(`${this.baseUrl}/children`, child);
  }

  updateChild(id: string, child: Partial<Child>): Observable<Child> {
    return this.api.put<Child>(`${this.baseUrl}/children/${id}`, child);
  }

  deleteChild(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/children/${id}`);
  }

  // ==================== SUPPLIERS ====================

  getSuppliers(): Observable<Supplier[]> {
    return this.api.get<Supplier[]>(`${this.baseUrl}/suppliers`);
  }

  getSupplier(id: string): Observable<Supplier> {
    return this.api.get<Supplier>(`${this.baseUrl}/suppliers/${id}`);
  }

  createSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
    return this.api.post<Supplier>(`${this.baseUrl}/suppliers`, supplier);
  }

  updateSupplier(id: string, supplier: Partial<Supplier>): Observable<Supplier> {
    return this.api.put<Supplier>(`${this.baseUrl}/suppliers/${id}`, supplier);
  }

  deleteSupplier(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/suppliers/${id}`);
  }

  // ==================== PRODUCTS ====================

  getProducts(): Observable<Product[]> {
    return this.api.get<Product[]>(`${this.baseUrl}/products`);
  }

  getProduct(id: string): Observable<Product> {
    return this.api.get<Product>(`${this.baseUrl}/products/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.api.post<Product>(`${this.baseUrl}/products`, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.api.put<Product>(`${this.baseUrl}/products/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/products/${id}`);
  }

  // ==================== MEALS ====================

  getMeals(): Observable<Meal[]> {
    return this.api.get<Meal[]>(`${this.baseUrl}/meals`);
  }

  getMeal(id: string): Observable<Meal> {
    return this.api.get<Meal>(`${this.baseUrl}/meals/${id}`);
  }

  createMeal(meal: Partial<Meal>): Observable<Meal> {
    return this.api.post<Meal>(`${this.baseUrl}/meals`, meal);
  }

  updateMeal(id: string, meal: Partial<Meal>): Observable<Meal> {
    return this.api.put<Meal>(`${this.baseUrl}/meals/${id}`, meal);
  }

  deleteMeal(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/meals/${id}`);
  }

  // ==================== TEMPERATURES ====================

  getTemperatures(): Observable<Temperature[]> {
    return this.api.get<Temperature[]>(`${this.baseUrl}/temperatures`);
  }

  getTemperature(id: string): Observable<Temperature> {
    return this.api.get<Temperature>(`${this.baseUrl}/temperatures/${id}`);
  }

  createTemperature(temperature: Partial<Temperature>): Observable<Temperature> {
    return this.api.post<Temperature>(`${this.baseUrl}/temperatures`, temperature);
  }

  updateTemperature(id: string, temperature: Partial<Temperature>): Observable<Temperature> {
    return this.api.put<Temperature>(`${this.baseUrl}/temperatures/${id}`, temperature);
  }

  deleteTemperature(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/temperatures/${id}`);
  }

  // ==================== EQUIPMENT ====================

  getEquipment(): Observable<Equipment[]> {
    return this.api.get<Equipment[]>(`${this.baseUrl}/equipment`);
  }

  getEquipmentItem(id: string): Observable<Equipment> {
    return this.api.get<Equipment>(`${this.baseUrl}/equipment/${id}`);
  }

  createEquipment(equipment: Partial<Equipment>): Observable<Equipment> {
    return this.api.post<Equipment>(`${this.baseUrl}/equipment`, equipment);
  }

  updateEquipment(id: string, equipment: Partial<Equipment>): Observable<Equipment> {
    return this.api.put<Equipment>(`${this.baseUrl}/equipment/${id}`, equipment);
  }

  deleteEquipment(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/equipment/${id}`);
  }

  // ==================== NON-COMPLIANCES ====================

  getNonCompliances(): Observable<NonCompliance[]> {
    return this.api.get<NonCompliance[]>(`${this.baseUrl}/non-compliances`);
  }

  getNonCompliance(id: string): Observable<NonCompliance> {
    return this.api.get<NonCompliance>(`${this.baseUrl}/non-compliances/${id}`);
  }

  createNonCompliance(nonCompliance: Partial<NonCompliance>): Observable<NonCompliance> {
    return this.api.post<NonCompliance>(`${this.baseUrl}/non-compliances`, nonCompliance);
  }

  updateNonCompliance(id: string, nonCompliance: Partial<NonCompliance>): Observable<NonCompliance> {
    return this.api.put<NonCompliance>(`${this.baseUrl}/non-compliances/${id}`, nonCompliance);
  }

  deleteNonCompliance(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/non-compliances/${id}`);
  }

  // ==================== DOCUMENTS ====================

  getDocuments(): Observable<Document[]> {
    return this.api.get<Document[]>(`${this.baseUrl}/documents`);
  }

  getDocument(id: string): Observable<Document> {
    return this.api.get<Document>(`${this.baseUrl}/documents/${id}`);
  }

  createDocument(document: Partial<Document>): Observable<Document> {
    return this.api.post<Document>(`${this.baseUrl}/documents`, document);
  }

  updateDocument(id: string, document: Partial<Document>): Observable<Document> {
    return this.api.put<Document>(`${this.baseUrl}/documents/${id}`, document);
  }

  deleteDocument(id: string): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/documents/${id}`);
  }
}
