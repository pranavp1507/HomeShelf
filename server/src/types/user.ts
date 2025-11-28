/**
 * User entity and authentication types
 */

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'member';
  created_at: Date;
}

export interface UserInput {
  username: string;
  password: string;
  role: 'admin' | 'member';
}

export interface UserResponse {
  id: number;
  username: string;
  role: 'admin' | 'member';
  created_at: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: 'admin' | 'member';
  iat?: number;
  exp?: number;
}

export interface PasswordUpdateRequest {
  newPassword: string;
}

export interface SetupRequest {
  username: string;
  password: string;
}
