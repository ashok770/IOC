// ==============================================================================
// OSINT Sentinel — Assessment History & Comparison API Client
// ==============================================================================

import { apiClient } from './client';
import {
  AssessmentRunListResponse,
  AssessmentRunDetail,
  AssessmentComparisonResponse,
} from '../types/history';

export const historyApi = {
  /**
   * Fetches paginated list of historical assessment runs for an authorized target (newest first).
   */
  getAssessmentRuns: (
    targetId: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<AssessmentRunListResponse> => {
    return apiClient.get<AssessmentRunListResponse>(`v1/targets/${targetId}/assessments`, {
      params: { skip, limit },
    });
  },

  /**
   * Fetches detail and snapshots of a specific historical assessment run.
   */
  getAssessmentDetail: (
    targetId: string,
    assessmentId: string
  ): Promise<AssessmentRunDetail> => {
    return apiClient.get<AssessmentRunDetail>(
      `v1/targets/${targetId}/assessments/${assessmentId}`
    );
  },

  /**
   * Executes deterministic comparison between base_run_id and target_run_id.
   */
  compareAssessments: (
    targetId: string,
    baseRunId: string,
    targetRunId: string
  ): Promise<AssessmentComparisonResponse> => {
    return apiClient.get<AssessmentComparisonResponse>(
      `v1/targets/${targetId}/assessments/compare`,
      {
        params: {
          base_run_id: baseRunId,
          target_run_id: targetRunId,
        },
      }
    );
  },
};
