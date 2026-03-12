export interface DatasetInfo {
  name: string;
  rows: number;
  columns: number;
  targetColumn: string;
  preview: Record<string, string | number>[];
  numericFeatures: number;
  categoricalFeatures: number;
  missingPercentage: number;
  classImbalance: number;
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
  | "recommending"
  | "recommended"
  | "training"
  | "trained"
  | "complete";
