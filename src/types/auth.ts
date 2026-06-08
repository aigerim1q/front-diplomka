export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  mustChangePassword: boolean
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type UserRole =
  | 1  // SuperAdmin
  | 2  // ConstructionCompanyAdmin
  | 3  // KskAdmin
  | 4  // BusinessAdmin
  | 5  // Resident
  | 6  // Worker
  | 7  // KskSeniorAdmin

export type UserStatus = 1 | 2 // 1 = Active, 2 = Blocked

export interface AuthUser {
  userId: string
  email: string
  role: UserRole
  tenantId?: string
  mustChangePassword: boolean
  complexId?: string
  complexName?: string
}
