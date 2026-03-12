import { create } from "zustand";
import type { DatasetInfo, ModelRecommendation, TrainingResult, Experiment, PipelineStep } from "@/types/pipeline";

interface PipelineState {
  step: PipelineStep;
  dataset: DatasetInfo | null;
  recommendations: ModelRecommendation[];
  trainingResults: TrainingResult[];
  trainingProgress: Record<string, number>;
  experiments: Experiment[];
  setStep: (step: PipelineStep) => void;
  setDataset: (d: DatasetInfo) => void;
  setRecommendations: (r: ModelRecommendation[]) => void;
  setTrainingResults: (r: TrainingResult[]) => void;
  setTrainingProgress: (p: Record<string, number>) => void;
  addExperiment: (e: Experiment) => void;
  reset: () => void;
}

export const usePipeline = create<PipelineState>((set) => ({
  step: "idle",
  dataset: null,
  recommendations: [],
  trainingResults: [],
  trainingProgress: {},
  experiments: [
    { id: "1", datasetName: "iris.csv", datasetSize: 150, featureCount: 4, bestModel: "Random Forest", accuracy: 0.97, date: "2026-03-01" },
    { id: "2", datasetName: "titanic.csv", datasetSize: 891, featureCount: 11, bestModel: "XGBoost", accuracy: 0.84, date: "2026-03-05" },
    { id: "3", datasetName: "wine.csv", datasetSize: 178, featureCount: 13, bestModel: "SVM", accuracy: 0.95, date: "2026-03-08" },
  ],
  setStep: (step) => set({ step }),
  setDataset: (dataset) => set({ dataset }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setTrainingResults: (trainingResults) => set({ trainingResults }),
  setTrainingProgress: (trainingProgress) => set({ trainingProgress }),
  addExperiment: (e) => set((s) => ({ experiments: [e, ...s.experiments] })),
  reset: () => set({ step: "idle", dataset: null, recommendations: [], trainingResults: [], trainingProgress: {} }),
}));
