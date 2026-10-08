// ==============================================================================
// OSINT Sentinel — Assessment History & Change Intelligence Types
// ==============================================================================

export interface AssessmentRun {
  id: string;
  target_id: string;
  status: 'in_progress' | 'completed' | 'partial' | 'failed';
  started_at: string;
  completed_at: string | null;
  overall_score: number;
  risk_level: string;
  total_assets: number;
  total_technologies: number;
  total_exposure_signals: number;
  total_findings: number;
  total_evidence_items: number;
  sources_status: Record<string, string> | null;
  error_message: string | null;
  factors_breakdown?: Record<string, number> | null;
}

export interface AssessmentRunListResponse {
  items: AssessmentRun[];
  total: number;
  limit: number;
  offset: number;
}

export interface AssessmentRunAssetSnapshot {
  id: string;
  assessment_run_id: string;
  target_id: string;
  asset_id: string | null;
  asset_type: string;
  value: string;
  source: string;
  priority_score: number | null;
  priority_level: string | null;
}

export interface AssessmentRunTechnologySnapshot {
  id: string;
  assessment_run_id: string;
  target_id: string;
  asset_value: string | null;
  name: string;
  category: string;
  version: string | null;
  detection_method: string;
  confidence: number;
}

export interface AssessmentRunExposureSignalSnapshot {
  id: string;
  assessment_run_id: string;
  target_id: string;
  asset_value: string | null;
  signal_type: string;
  category: string;
  title: string;
  severity: string;
  confidence: number;
}

export interface AssessmentRunDetail extends AssessmentRun {
  asset_snapshots: AssessmentRunAssetSnapshot[];
  technology_snapshots: AssessmentRunTechnologySnapshot[];
  exposure_signal_snapshots: AssessmentRunExposureSignalSnapshot[];
}

// Comparison Response Schemas

export interface AssetDeltaItem {
  asset_type: string;
  value: string;
  source: string;
  priority_score: number | null;
  priority_level: string | null;
}

export interface AssetComparisonResult {
  added: AssetDeltaItem[];
  removed: AssetDeltaItem[];
  unchanged: AssetDeltaItem[];
}

export interface TechVersionChangeItem {
  technology: string;
  asset_value: string | null;
  category: string;
  previous_version: string | null;
  current_version: string | null;
}

export interface TechDeltaItem {
  asset_value: string | null;
  name: string;
  category: string;
  version: string | null;
  detection_method: string;
  confidence: number;
}

export interface TechnologyComparisonResult {
  added: TechDeltaItem[];
  removed: TechDeltaItem[];
  version_changes: TechVersionChangeItem[];
  unchanged: TechDeltaItem[];
}

export interface SignalDeltaItem {
  asset_value: string | null;
  signal_type: string;
  category: string;
  title: string;
  severity: string;
  confidence: number;
}

export interface ExposureSignalComparisonResult {
  new: SignalDeltaItem[];
  resolved: SignalDeltaItem[];
  unchanged: SignalDeltaItem[];
}

export interface ScoreComparison {
  previous: number;
  current: number;
  delta: number;
}

export interface LevelComparison {
  previous: string;
  current: string;
  changed: boolean;
}

export interface FactorDeltaItem {
  category: string;
  previous_score: number;
  current_score: number;
  delta: number;
}

export interface RiskComparisonResult {
  overall_score: ScoreComparison;
  risk_level: LevelComparison;
  factor_deltas: FactorDeltaItem[];
}

export interface ComparisonSummary {
  asset_delta: number;
  technology_delta: number;
  new_exposure_signals: number;
  resolved_exposure_signals: number;
  score_delta: number;
  risk_level_changed: boolean;
}

export interface AssessmentComparisonResponse {
  base_assessment: AssessmentRun;
  target_assessment: AssessmentRun;
  summary: ComparisonSummary;
  assets: AssetComparisonResult;
  technologies: TechnologyComparisonResult;
  exposure_signals: ExposureSignalComparisonResult;
  risk: RiskComparisonResult;
}
