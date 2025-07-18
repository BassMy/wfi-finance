// src/types/common.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}