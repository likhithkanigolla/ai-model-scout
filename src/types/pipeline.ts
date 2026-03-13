export interface DatasetInfo {
  id: string;
  name: string;
  rows: number;
  columns: number;
  targetColumn: string;
  preview: Record<string, string | number | null>[];
  numericFeatures: number;
  categoricalFeatures: number;
  missingPercentage: number;
  classImbalance: number;
  classDistribution?: Record<string, number>;
}

export interface ModelRecommendation {
  name: string;
  reason: string;
  strengths: string[];
  score: number;
}

export interface TrainingResult {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingTime: string;
  artifactId?: string;
  downloadUrl?: string;
}

export interface Experiment {
  id: string;
  datasetName: string;
  datasetSize: number;
  featureCount: number;
  bestModel: string;
  accuracy: number;
  date: string;
}

export type PipelineStep =
  | "idle"
  | "uploaded"
  | "analyzing"
  | "analyzed"
  | "configuring"
  | "recommending"
  | "recommended"
  | "training"
  | "trained"
  | "complete";
