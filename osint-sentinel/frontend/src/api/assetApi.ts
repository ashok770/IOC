import { apiClient } from './client';
import { Asset, AssetListResponse, RelationshipListResponse } from '../types';

export interface ListAssetParams {
  asset_type?: string;
  skip?: number;
  limit?: number;
}

export const assetApi = {
  /**
   * List discovered perimeter assets for a target with optional filtering by asset_type.
   */
  listTargetAssets: (targetId: string, params: ListAssetParams = {}) =>
    apiClient.get<AssetListResponse>(`/v1/targets/${targetId}/assets`, {
      params: {
        asset_type: params.asset_type,
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    }),

  /**
   * Get specific asset record scoped under a target.
   */
  getTargetAsset: (targetId: string, assetId: string) =>
    apiClient.get<Asset>(`/v1/targets/${targetId}/assets/${assetId}`),

  /**
   * Direct lookup of an asset by ID.
   */
  getAsset: (targetId: string, assetId: string) =>
    apiClient.get<Asset>(`/v1/assets/${assetId}`, { params: { target_id: targetId } }),

  /**
   * List semantic relationships involving this asset.
   */
  getAssetRelationships: (targetId: string, assetId: string) =>
    apiClient.get<RelationshipListResponse>(`/v1/assets/${assetId}/relationships`, { params: { target_id: targetId } }),
};
