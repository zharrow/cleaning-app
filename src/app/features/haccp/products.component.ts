import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HaccpService, Product, Supplier } from '../../core/services/haccp.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="products-page">
      <div class="header flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Produits & Stocks</h1>
        <button (click)="openModal()" class="btn-primary px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Ajouter un produit
        </button>
      </div>

      <!-- Alertes -->
      @if (expiredProducts().length > 0) {
        <div class="alert bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🚨</span>
            <div>
              <h3 class="font-bold text-red-700">Produits périmés</h3>
              <p class="text-red-600">{{ expiredProducts().length }} produit(s) périmé(s) à retirer immédiatement</p>
            </div>
          </div>
        </div>
      }
      @if (expiringSoonProducts().length > 0) {
        <div class="alert bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
          <div class="flex items-center gap-2">
            <span class="text-2xl">⚠️</span>
            <div>
              <h3 class="font-bold text-orange-700">Péremption proche</h3>
              <p class="text-orange-600">{{ expiringSoonProducts().length }} produit(s) arrivent à péremption</p>
            </div>
          </div>
        </div>
      }

      <!-- Filtres -->
      <div class="filters flex gap-4 mb-6">
        <input
          [(ngModel)]="searchTerm"
          (ngModelChange)="applyFilters()"
          placeholder="Rechercher un produit..."
          class="flex-1 px-3 py-2 border rounded">
        <select [(ngModel)]="categoryFilter" (ngModelChange)="applyFilters()" class="px-3 py-2 border rounded">
          <option value="">Toutes catégories</option>
          <option value="Viande">Viande</option>
          <option value="Laitier">Laitier</option>
          <option value="Légume">Légume</option>
          <option value="Fruit">Fruit</option>
          <option value="Féculents">Féculents</option>
          <option value="Autre">Autre</option>
        </select>
      </div>

      <!-- Liste produits -->
      <div class="products-table bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-semibold">Produit</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Catégorie</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Allergènes</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Stock</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Péremption</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Fournisseur</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (product of filteredProducts(); track product.id) {
              <tr class="border-t hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div class="font-semibold">{{ product.name }}</div>
                </td>
                <td class="px-4 py-3">
                  @if (product.category) {
                    <span class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {{ product.category }}
                    </span>
                  }
                </td>
                <td class="px-4 py-3">
                  @if (product.allergens) {
                    <span class="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                      {{ product.allergens }}
                    </span>
                  }
                </td>
                <td class="px-4 py-3">
                  @if (product.current_stock !== null && product.current_stock !== undefined) {
                    <span [class.text-red-600]="product.current_stock < 5">
                      {{ product.current_stock }} {{ product.stock_unit }}
                    </span>
                  }
                </td>
                <td class="px-4 py-3">
                  @if (product.expiry_date) {
                    <span
                      [class.text-red-600]="isExpired(product.expiry_date)"
                      [class.text-orange-600]="isExpiringSoon(product.expiry_date) && !isExpired(product.expiry_date)"
                      [class.text-green-600]="!isExpiringSoon(product.expiry_date)">
                      {{ product.expiry_date | date:'shortDate' }}
                    </span>
                  }
                </td>
                <td class="px-4 py-3 text-sm text-gray-600">
                  {{ getSupplierName(product.supplier_id) }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <button (click)="editProduct(product)" class="text-sm text-blue-600 hover:underline">Modifier</button>
                    <button (click)="deleteProduct(product)" class="text-sm text-red-600 hover:underline">Supprimer</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-400">
                  Aucun produit trouvé
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content max-w-2xl" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ editingProduct() ? 'Modifier' : 'Ajouter' }} un produit</h3>
              <button class="modal-close" (click)="closeModal()">✕</button>
            </div>
            <form (ngSubmit)="saveProduct()">
              <div class="modal-body">
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                      <label class="form-label required">Nom du produit</label>
                      <input [(ngModel)]="formData.name" name="name" required class="form-input">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Catégorie</label>
                      <select [(ngModel)]="formData.category" name="category" class="form-select">
                        <option value="">Sélectionner</option>
                        <option value="Viande">Viande</option>
                        <option value="Laitier">Laitier</option>
                        <option value="Légume">Légume</option>
                        <option value="Fruit">Fruit</option>
                        <option value="Féculents">Féculents</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Allergènes</label>
                    <input [(ngModel)]="formData.allergens" name="allergens" placeholder="Ex: Gluten, Lait, Œufs" class="form-input">
                    @if (formData.allergens) {
                      <p class="text-xs text-orange-600 mt-1">⚠️ Allergènes détectés</p>
                    }
                  </div>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="form-group">
                      <label class="form-label">Stock actuel</label>
                      <input [(ngModel)]="formData.current_stock" name="current_stock" type="number" step="0.1" class="form-input">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Unité</label>
                      <select [(ngModel)]="formData.stock_unit" name="stock_unit" class="form-select">
                        <option value="kg">kg</option>
                        <option value="L">L</option>
                        <option value="unité">unité</option>
                        <option value="g">g</option>
                        <option value="mL">mL</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Date de péremption</label>
                      <input [(ngModel)]="formData.expiry_date" name="expiry_date" type="date" class="form-input">
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Fournisseur</label>
                    <select [(ngModel)]="formData.supplier_id" name="supplier_id" class="form-select">
                      <option value="">Aucun</option>
                      @for (supplier of suppliers(); track supplier.id) {
                        <option [value]="supplier.id">{{ supplier.name }}</option>
                      }
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ProductsComponent implements OnInit {
  private haccpService = inject(HaccpService);

  products = signal<Product[]>([]);
  filteredProducts = signal<Product[]>([]);
  suppliers = signal<Supplier[]>([]);
  showModal = signal(false);
  editingProduct = signal<Product | null>(null);

  searchTerm = '';
  categoryFilter = '';

  formData: Partial<Product> = {
    name: '',
    category: '',
    allergens: '',
    stock_unit: 'kg',
    current_stock: 0,
    expiry_date: '',
    supplier_id: undefined
  };

  expiredProducts = computed(() => {
    return this.products().filter(p => p.expiry_date && this.isExpired(p.expiry_date));
  });

  expiringSoonProducts = computed(() => {
    return this.products().filter(p => p.expiry_date && this.isExpiringSoon(p.expiry_date) && !this.isExpired(p.expiry_date));
  });

  ngOnInit() {
    this.loadProducts();
    this.loadSuppliers();
  }

  loadProducts() {
    this.haccpService.getProducts().subscribe(products => {
      this.products.set(products);
      this.applyFilters();
    });
  }

  loadSuppliers() {
    this.haccpService.getSuppliers().subscribe(s => this.suppliers.set(s));
  }

  applyFilters() {
    let filtered = this.products();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    }

    if (this.categoryFilter) {
      filtered = filtered.filter(p => p.category === this.categoryFilter);
    }

    this.filteredProducts.set(filtered);
  }

  openModal() {
    this.formData = {
      name: '',
      category: '',
      allergens: '',
      stock_unit: 'kg',
      current_stock: 0,
      expiry_date: '',
      supplier_id: undefined
    };
    this.editingProduct.set(null);
    this.showModal.set(true);
  }

  editProduct(product: Product) {
    this.formData = { ...product };
    this.editingProduct.set(product);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveProduct() {
    const editing = this.editingProduct();
    if (editing) {
      this.haccpService.updateProduct(editing.id, this.formData).subscribe(() => {
        this.loadProducts();
        this.closeModal();
      });
    } else {
      this.haccpService.createProduct(this.formData).subscribe(() => {
        this.loadProducts();
        this.closeModal();
      });
    }
  }

  deleteProduct(product: Product) {
    if (confirm('Supprimer ce produit ?')) {
      this.haccpService.deleteProduct(product.id).subscribe(() => this.loadProducts());
    }
  }

  isExpired(expiryDate: string): boolean {
    return new Date(expiryDate) < new Date();
  }

  isExpiringSoon(expiryDate: string): boolean {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }

  getSupplierName(supplierId?: string): string {
    if (!supplierId) return '-';
    const supplier = this.suppliers().find(s => s.id === supplierId);
    return supplier ? supplier.name : '-';
  }
}
