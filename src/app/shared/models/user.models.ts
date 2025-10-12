/**
 * Models for the 3-tier user system
 * Developer -> Admin -> User (Employee)
 */

// ==================== USER TYPES ====================

export type UserType = 'developer' | 'admin' | 'employee';

// ==================== DEVELOPER ====================

export interface Developer {
  readonly id: string;
  readonly email: string;
  readonly firebase_uid: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface DeveloperCreate {
  readonly email: string;
  readonly firebase_uid: string;
}

export interface DeveloperResponse extends Developer {
  readonly admins_count?: number;
}

// ==================== ADMIN ====================

export interface Admin {
  readonly id: string;
  readonly email: string;
  readonly firebase_uid: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly is_active: boolean;
  readonly created_by_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface AdminCreate {
  readonly email: string;
  readonly firebase_uid: string;
  readonly first_name: string;
  readonly last_name: string;
}

export interface AdminUpdate {
  readonly first_name?: string;
  readonly last_name?: string;
  readonly is_active?: boolean;
}

export interface AdminResponse extends Admin {
  readonly full_name: string;
  readonly enterprise?: {
    readonly id: string;
    readonly name: string;
  };
}

// ==================== USER (EMPLOYEE) ====================

export interface User {
  readonly id: string;
  readonly email?: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly is_active: boolean;
  readonly enterprise_id: string;
  readonly created_by_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface UserCreate {
  readonly first_name: string;
  readonly last_name: string;
  readonly pin_code: string;
  readonly email?: string;
}

export interface UserUpdate {
  readonly first_name?: string;
  readonly last_name?: string;
  readonly email?: string;
  readonly is_active?: boolean;
}

export interface UserPinUpdate {
  readonly pin_code: string;
}

export interface UserResponse extends User {
  readonly full_name: string;
  readonly accessible_rooms?: string[]; // Room IDs
}

// ==================== USER ROOMS ====================

export interface UserRooms {
  readonly id: string;
  readonly user_id: string;
  readonly room_id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface UserRoomsCreate {
  readonly user_id: string;
  readonly room_id: string;
}

export interface UserRoomsBulkUpdate {
  readonly room_ids: string[];
}

// ==================== AUTHENTICATION ====================

export interface UserLoginRequest {
  readonly pin_code: string;
  readonly enterprise_id: string;
}

export interface UserLoginResponse {
  readonly user: UserResponse;
  readonly accessible_rooms: string[];
}

// ==================== LEGACY (for backward compatibility) ====================

/**
 * @deprecated Use User instead
 */
export interface Performer extends User {}

/**
 * @deprecated Use UserCreate instead
 */
export interface PerformerCreate extends UserCreate {}

/**
 * @deprecated Use UserUpdate instead
 */
export interface PerformerUpdate extends UserUpdate {}
