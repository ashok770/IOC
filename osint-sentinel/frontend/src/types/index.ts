// ==============================================================================
// OSINT Sentinel — TypeScript Domain & API Type Definitions
// Derived directly from verified FastAPI/Pydantic schemas
// ==============================================================================

// ------------------------------------------------------------------------------
// Health & Diagnostics
// ------------------------------------------------------------------------------
export interface DatabaseHealth {
  connected: boolean;
  details: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | string;
  project: string;
  version: string;
  environment: string;
  timestamp: string;
  database: DatabaseHealth;
  mode: string;
}

// ------------------------------------------------------------------------------
// Target & Scope Management
// ------------------------------------------------------------------------------
export type TargetAssessmentStatus = 'pending' | 'in_progress' | 'completed' | 'partial' | 'failed' | string;

export interface Target {
  id: string;
  name: string | null;
  primary_domain: string;
  assessment_status: TargetAssessmentStatus;
  created_at: string;
  updated_at: string;
}

export interface TargetCreate {
  organization_name?: string | null;
  primary_domain: string;
}

export interface TargetListResponse {
  items: Target[];
  total: number;
}

// ------------------------------------------------------------------------------
// Collection & Intelligence Pipeline Summary
// ------------------------------------------------------------------------------
export interface CollectionSummaryResponse {
  target_id: string;
  domain: string;
  status: string;
  sources: Record<string, string>;
  evidence_items_created: number;
  assets_discovered: number;
  technologies_discovered: number;
  relationships_mapped: number;
  exposure_signals_identified: number;
  findings_created: number;
  timestamp: string;
}

// ------------------------------------------------------------------------------
// Asset Inventory
// ------------------------------------------------------------------------------
export type AssetType = 'domain' | 'subdomain' | 'ip' | 'certificate_associated_hostname' | string;

export interface Asset {
  id: string;
  target_id: string;
  asset_type: AssetType;
  value: string;
  discovered_at: string;
  last_seen_at: string;
  source: string;
  first_evidence_id: string | null;
  extra_data?: Record<string, unknown> | null;
}

export interface AssetListResponse {
  items: Asset[];
  total: number;
  target_id: string;
  asset_type_filter?: string | null;
  limit: number;
  offset: number;
}

// ------------------------------------------------------------------------------
// Technology Intelligence
// ------------------------------------------------------------------------------
export type TechnologyCategory =
  | 'web_server'
  | 'framework'
  | 'cms'
  | 'cdn'
  | 'cloud'
  | 'email'
  | 'other'
  | string;

export interface Technology {
  id: string;
  target_id: string;
  asset_id: string | null;
  name: string;
  category: TechnologyCategory;
  version: string | null;
  detection_method: string;
  confidence: number;
  first_seen: string;
  last_seen: string;
  evidence_id: string | null;
  extra_data?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TechnologyListResponse {
  items: Technology[];
  total: number;
  target_id?: string | null;
  asset_id?: string | null;
  category_filter?: string | null;
  limit: number;
  offset: number;
}

// ------------------------------------------------------------------------------
// Raw Evidence Artifacts
// ------------------------------------------------------------------------------
export interface EvidenceItem {
  id: string;
  target_id: string;
  evidence_type: string;
  source: string;
  source_url: string | null;
  collected_at: string;
  data: Record<string, unknown>;
  confidence: number;
  notes: string | null;
}

export interface EvidenceListResponse {
  items: EvidenceItem[];
  total: number;
  target_id: string;
  evidence_type_filter?: string | null;
  limit: number;
  offset: number;
}

// ------------------------------------------------------------------------------
// Factual Findings & Observations
// ------------------------------------------------------------------------------
export interface Finding {
  id: string;
  target_id: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  confidence: number;
  evidence_id: string | null;
  created_at: string;
}

export interface FindingListResponse {
  items: Finding[];
  total: number;
  target_id: string;
}

// ------------------------------------------------------------------------------
// Semantic Graph Relationships
// ------------------------------------------------------------------------------
export interface Relationship {
  id: string;
  target_id: string;
  source_type: string;
  source_id: string;
  relationship_type: string;
  target_type: string;
  target_id_reference: string;
  evidence_id: string | null;
  confidence: number;
  extra_data?: Record<string, unknown> | null;
  created_at: string;
}

export interface RelationshipListResponse {
  items: Relationship[];
  total: number;
  target_id?: string | null;
  asset_id?: string | null;
  relationship_type_filter?: string | null;
  source_type_filter?: string | null;
  target_type_filter?: string | null;
  limit: number;
  offset: number;
}

// ------------------------------------------------------------------------------
// Exposure Signals
// ------------------------------------------------------------------------------
export interface ExposureSignal {
  id: string;
  target_id: string;
  asset_id: string | null;
  signal_type: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  confidence: number;
  evidence_id: string | null;
  extra_data?: Record<string, unknown> | null;
  created_at: string;
}

export interface ExposureSignalListResponse {
  items: ExposureSignal[];
  total: number;
  target_id: string;
  category_filter?: string | null;
  min_confidence?: number | null;
  limit: number;
  offset: number;
}

// ------------------------------------------------------------------------------
// Analysis & Posture Summary
// ------------------------------------------------------------------------------
export interface AnalysisSummary {
  target_id: string;
  domain: string;
  assets: number;
  technologies: number;
  evidence_items: number;
  relationships: number;
  exposure_signals: number;
  informational_findings: number;
  overall_risk_score: number | null;
  risk_level: string | null;
}

// ------------------------------------------------------------------------------
// Risk Engine & Asset Prioritization
// ------------------------------------------------------------------------------
export interface RiskRecommendation {
  priority: string;
  category: string;
  title: string;
  action: string;
  rationale: string;
  evidence_id?: string | null;
  recommended_investigation?: string | null;
}

export interface RiskAssessment {
  id: string;
  target_id: string;
  overall_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical' | string;
  factors_breakdown: Record<string, number>;
  recommendations: RiskRecommendation[];
  created_at: string;
  updated_at: string;
}

export interface AssetContributingFactor {
  factor?: string;
  factor_name?: string;
  score_impact: number;
  reason?: string;
  description?: string;
  evidence_id?: string | null;
  recommended_investigation?: string | null;
}

export interface AssetRiskScore {
  id: string;
  target_id: string;
  asset_id: string;
  asset_value?: string | null;
  asset_type?: string | null;
  priority_score: number;
  priority_level: 'p1_urgent' | 'p2_high' | 'p3_medium' | 'p4_low' | string;
  contributing_factors: AssetContributingFactor[];
  created_at: string;
  updated_at: string;
}

export interface AssetRiskScoreListResponse {
  items: AssetRiskScore[];
  total: number;
  target_id: string;
  priority_level_filter?: string | null;
  limit: number;
  offset: number;
}
