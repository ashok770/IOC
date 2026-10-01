import { apiClient } from './client';
import { TechnologyListResponse } from '../types';

export interface ListTechnologyParams {
  asset_id?: string;
  category?: string;
  skip?: number;
  limit?: number;
}

export const technologyApi = {
  /**
   * List detected technologies for a target with optional category/asset filters.
   */
  listTargetTechnologies: (targetId: string, params: ListTechnologyParams = {}) =>
    apiClient.get<TechnologyListResponse>(`/v1/targets/${targetId}/technologies`, {
      params: {
        asset_id: params.asset_id,
        category: params.category,
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    }),

  /**
   * List technologies observed directly on a specific asset.
   */
  listAssetTechnologies: (assetId: string, skip: number = 0, limit: number = 100) =>
    apiClient.get<TechnologyListResponse>(`/v1/assets/${assetId}/technologies`, {
      params: { skip, limit },
    }),
};
