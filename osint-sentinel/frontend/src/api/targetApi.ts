import { apiClient } from './client';
import {
  Target,
  TargetCreate,
  TargetListResponse,
  CollectionSummaryResponse,
  AnalysisSummary,
} from '../types';

export const targetApi = {
  /**
   * Register a new authorized target domain.
   */
  createTarget: (payload: TargetCreate) =>
    apiClient.post<Target>('/v1/targets', payload),

  /**
   * List registered targets with pagination.
   */
  listTargets: (skip: number = 0, limit: number = 50) =>
    apiClient.get<TargetListResponse>('/v1/targets', { params: { skip, limit } }),

  /**
   * Get specific target details by ID.
   */
  getTarget: (targetId: string) =>
    apiClient.get<Target>(`/v1/targets/${targetId}`),

  /**
   * Trigger passive domain intelligence pipeline.
   */
  collectDomain: (targetId: string) =>
    apiClient.post<CollectionSummaryResponse>(`/v1/targets/${targetId}/collect/domain`),

  /**
   * Get aggregated KPI counts and overall risk posture metrics.
   */
  getAnalysisSummary: (targetId: string) =>
    apiClient.get<AnalysisSummary>(`/v1/targets/${targetId}/analysis/summary`),
};
