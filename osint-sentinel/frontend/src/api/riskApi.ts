import { apiClient } from './client';
import { RiskAssessment, AssetRiskScore, AssetRiskScoreListResponse } from '../types';

export const riskApi = {
  /**
   * Get deterministic target risk assessment and recommendations.
   */
  getTargetRisk: (targetId: string) =>
    apiClient.get<RiskAssessment>(`/v1/targets/${targetId}/risk`),

  /**
   * List prioritized perimeter assets for a target (P1-P4).
   */
  listTargetAssetPriorities: (targetId: string, priorityLevel?: string, skip: number = 0, limit: number = 100) =>
    apiClient.get<AssetRiskScoreListResponse>(`/v1/targets/${targetId}/risk/assets`, {
      params: { priority_level: priorityLevel, skip, limit },
    }),

  /**
   * Get asset-level risk score and contributing exposure factors.
   */
  getAssetRisk: (targetId: string, assetId: string) =>
    apiClient.get<AssetRiskScore>(`/v1/assets/${assetId}/risk`, { params: { target_id: targetId } }),
};
