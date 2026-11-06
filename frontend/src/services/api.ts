import axios from 'axios';
import {
  AuthResponse,
  User,
  Investigation,
  BulkJobProgress,
  PreflightResult,
  PaginatedTableResponse,
  FullNumberReportResponse,
  SourceProvider,
  DashboardAnalytics
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('numberintel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('numberintel_token');
        localStorage.removeItem('numberintel_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },
  register: async (email: string, password: string, fullName?: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', { email, password, full_name: fullName });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

export const investigationService = {
  list: async (): Promise<Investigation[]> => {
    const res = await api.get<Investigation[]>('/investigations');
    return res.data;
  },
  get: async (id: string): Promise<Investigation> => {
    const res = await api.get<Investigation>(`/investigations/${id}`);
    return res.data;
  },
  getTable: async (
    id: string,
    page = 1,
    pageSize = 25,
    search = '',
    statusFilter = ''
  ): Promise<PaginatedTableResponse> => {
    const res = await api.get<PaginatedTableResponse>(`/investigations/${id}/table`, {
      params: { page, page_size: pageSize, search: search || undefined, status_filter: statusFilter || undefined },
    });
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/investigations/${id}`);
  },
  export: (id: string, format: 'csv' | 'xlsx' | 'json'): string => {
    const token = localStorage.getItem('numberintel_token');
    return `${API_BASE_URL}/api/v1/reports/${id}/export?format=${format}&token=${token}`;
  },
};

export const bulkService = {
  preflight: async (rawText: string, defaultCountry = 'IN'): Promise<PreflightResult> => {
    const res = await api.post<PreflightResult>('/bulk/preflight', {
      raw_text: rawText,
      default_country: defaultCountry,
    });
    return res.data;
  },
  submitPaste: async (rawText: string, defaultCountry = 'IN', title?: string): Promise<BulkJobProgress> => {
    const res = await api.post<BulkJobProgress>('/bulk/paste', {
      raw_text: rawText,
      default_country: defaultCountry,
      investigation_title: title,
    });
    return res.data;
  },
  uploadFile: async (file: File, defaultCountry = 'IN', title?: string): Promise<BulkJobProgress> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('default_country', defaultCountry);
    if (title) formData.append('investigation_title', title);

    const res = await api.post<BulkJobProgress>('/bulk/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getProgress: async (jobId: string): Promise<BulkJobProgress> => {
    const res = await api.get<BulkJobProgress>(`/bulk/jobs/${jobId}/progress`);
    return res.data;
  },
  cancelJob: async (jobId: string): Promise<void> => {
    await api.post(`/bulk/jobs/${jobId}/cancel`);
  },
};

export const numberService = {
  singleLookup: async (phoneNumber: string, defaultCountry = 'IN', title?: string): Promise<FullNumberReportResponse> => {
    const res = await api.post<FullNumberReportResponse>('/numbers/single', {
      phone_number: phoneNumber,
      default_country: defaultCountry,
      investigation_title: title,
    });
    return res.data;
  },
  getReport: async (taskId: string): Promise<FullNumberReportResponse> => {
    const res = await api.get<FullNumberReportResponse>(`/numbers/${taskId}/report`);
    return res.data;
  },
};

export const providerService = {
  list: async (): Promise<SourceProvider[]> => {
    const res = await api.get<SourceProvider[]>('/providers');
    return res.data;
  },
  update: async (id: string, data: { is_active?: boolean; api_key?: string; rate_limit_per_minute?: number; daily_quota?: number }): Promise<SourceProvider> => {
    const res = await api.patch<SourceProvider>(`/providers/${id}`, data);
    return res.data;
  },
  test: async (id: string): Promise<{ status: string; message: string }> => {
    const res = await api.post(`/providers/${id}/test`);
    return res.data;
  },
};

export const analyticsService = {
  getDashboard: async (): Promise<DashboardAnalytics> => {
    const res = await api.get<DashboardAnalytics>('/analytics/dashboard');
    return res.data;
  },
};

export const spamService = {
  report: async (phoneNumber: string, spamCategory: string, description?: string) => {
    const res = await api.post('/spam/report', {
      phone_number: phoneNumber,
      spam_category: spamCategory,
      description,
    });
    return res.data;
  },
};

export const auditService = {
  getLogs: async () => {
    const res = await api.get('/audit/logs');
    return res.data;
  },
};
