import { apiClient } from './client';
import { RelationshipListResponse } from '../types';

export interface ListRelationshipParams {
  relationship_type?: string;
  source_type?: string;
  target_type?: string;
  skip?: number;
  limit?: number;
}

export const relationshipApi = {
  /**
   * List semantic directed graph relationships under an authorized target.
   */
  listTargetRelationships: (targetId: string, params: ListRelationshipParams = {}) =>
    apiClient.get<RelationshipListResponse>(`/v1/targets/${targetId}/relationships`, {
      params: {
        relationship_type: params.relationship_type,
        source_type: params.source_type,
        target_type: params.target_type,
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    }),

  /**
   * List relationships directly referencing a specific asset.
   */
  listAssetRelationships: (assetId: string, skip: number = 0, limit: number = 100) =>
    apiClient.get<RelationshipListResponse>(`/v1/assets/${assetId}/relationships`, {
      params: { skip, limit },
    }),
};
