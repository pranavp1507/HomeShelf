/**
 * Member entity and related types
 */

export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: Date;
}

export interface MemberInput {
  name: string;
  email: string;
  phone: string;
}

export interface MemberQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MemberWithStats extends Member {
  activeLoans?: number;
  totalLoans?: number;
  overdueLoans?: number;
}
