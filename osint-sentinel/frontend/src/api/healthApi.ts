import { apiClient } from './client';
import { HealthResponse } from '../types';

export const healthApi = {
  /**
   * Safe service and database reachability check (/api/health).
   */
  getHealth: () => apiClient.get<HealthResponse>('/health'),
};
