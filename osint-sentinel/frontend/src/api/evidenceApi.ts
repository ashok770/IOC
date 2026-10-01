import { apiClient } from './client';
import { EvidenceListResponse } from '../types';

export interface ListEvidenceParams {
  evidence_type?: string;
  skip?: number;
  limit?: number;
}

export const evidenceApi = {
  /**
   * List paginated raw evidence artifacts collected for a target.
   */
  listEvidence: (targetId: string, params: ListEvidenceParams = {}) =>
    apiClient.get<EvidenceListResponse>(`/v1/targets/${targetId}/evidence`, {
      params: {
        evidence_type: params.evidence_type,
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    }),
};
