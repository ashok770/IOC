import { apiClient } from './client';
import { ExposureSignalListResponse, FindingListResponse } from '../types';

export interface ListExposureSignalParams {
  category?: string;
  confidence?: number;
  skip?: number;
  limit?: number;
}

export const exposureApi = {
  /**
   * List security-relevant exposure signals for a target.
   */
  listExposureSignals: (targetId: string, params: ListExposureSignalParams = {}) =>
    apiClient.get<ExposureSignalListResponse>(`/v1/targets/${targetId}/exposure-signals`, {
      params: {
        category: params.category,
        confidence: params.confidence,
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    }),

  /**
   * List factual architectural observation findings.
   */
  listFindings: (targetId: string, category?: string, skip: number = 0, limit: number = 100) =>
    apiClient.get<FindingListResponse>(`/v1/targets/${targetId}/findings`, {
      params: { category, skip, limit },
    }),
};
