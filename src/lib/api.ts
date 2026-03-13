export interface UploadResponse {
  id: string;
  rows: number;
  columns: number;
  preview: Record<string, string | number | null>[];
}

export interface AnalyzeResponse {
  dataset_id: string;
  number_of_samples: number;
  number_of_features: number;
  numeric_feature_count: number;
  categorical_feature_count: number;
  missing_value_ratio: number;
  class_distribution: Record<string, number>;
  imbalance_ratio: number;
  included_columns: string[];
  excluded_columns: string[];
  column_profiles: Array<{
    name: string;
    data_type: string;
    missing_ratio: number;
    unique_count: number;
  }>;
  meta_features: Record<string, string | number | null>;
}

export interface RecommendResponse {
  dataset_id: string;
  models: string[];
  reasoning: string;
}

export interface TrainResultItem {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  training_time: number;
  artifact_id?: string | null;
  download_url?: string | null;
}

export interface TrainResponse {
  dataset_id: string;
  results: TrainResultItem[];
}

export interface DashboardModelPerformance {
  model_name: string;
  average_accuracy: number;
}

export interface DashboardSummaryResponse {
  datasets_processed: number;
  experiments_run: number;
  models_tested: number;
  best_accuracy: number;
  model_performance: DashboardModelPerformance[];
}

export interface KnowledgeBaseEntry {
  id: string;
  dataset_id: string;
  dataset_name: string;
  target_column: string;
  recommended_models: string[];
  reasoning: string;
  system_guidance: string[];
  best_model: string;
  best_accuracy: number;
  top_recommendation_model?: string | null;
  top_recommendation_worked: boolean;
  experiment_count: number;
  created_at: string;
}

export interface KnowledgeBaseResponse {
  rulebook: string[];
  entries: KnowledgeBaseEntry[];
}

const viteEnv = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;

const API_BASE = viteEnv.VITE_API_BASE_URL || "/api";
const ENABLE_FALLBACK = (viteEnv.VITE_ENABLE_API_FALLBACK ?? "true") !== "false";

const MOCK_PREVIEW = [
  { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2, species: "setosa" },
  { sepal_length: 4.9, sepal_width: 3.0, petal_length: 1.4, petal_width: 0.2, species: "setosa" },
  { sepal_length: 4.7, sepal_width: 3.2, petal_length: 1.3, petal_width: 0.2, species: "setosa" },
  { sepal_length: 5.0, sepal_width: 3.6, petal_length: 1.4, petal_width: 0.2, species: "setosa" },
  { sepal_length: 5.4, sepal_width: 3.9, petal_length: 1.7, petal_width: 0.4, species: "setosa" },
  { sepal_length: 7.0, sepal_width: 3.2, petal_length: 4.7, petal_width: 1.4, species: "versicolor" },
  { sepal_length: 6.4, sepal_width: 3.2, petal_length: 4.5, petal_width: 1.5, species: "versicolor" },
  { sepal_length: 6.9, sepal_width: 3.1, petal_length: 4.9, petal_width: 1.5, species: "versicolor" },
  { sepal_length: 6.3, sepal_width: 3.3, petal_length: 6.0, petal_width: 2.5, species: "virginica" },
  { sepal_length: 5.8, sepal_width: 2.7, petal_length: 5.1, petal_width: 1.9, species: "virginica" },
];

const MOCK_ANALYSIS: AnalyzeResponse = {
  dataset_id: "mock-dataset-id",
  number_of_samples: 150,
  number_of_features: 4,
  numeric_feature_count: 4,
  categorical_feature_count: 0,
  missing_value_ratio: 0,
  class_distribution: { setosa: 0.3333, versicolor: 0.3333, virginica: 0.3333 },
  imbalance_ratio: 1.0,
  included_columns: ["sepal_length", "sepal_width", "petal_length", "petal_width"],
  excluded_columns: [],
  column_profiles: [
    { name: "sepal_length", data_type: "numeric", missing_ratio: 0, unique_count: 35 },
    { name: "sepal_width", data_type: "numeric", missing_ratio: 0, unique_count: 23 },
    { name: "petal_length", data_type: "numeric", missing_ratio: 0, unique_count: 43 },
    { name: "petal_width", data_type: "numeric", missing_ratio: 0, unique_count: 22 },
  ],
  meta_features: {},
};

const MOCK_RECOMMENDATION: RecommendResponse = {
  dataset_id: "mock-dataset-id",
  models: ["Random Forest", "XGBoost", "Support Vector Machine"],
  reasoning: "Mock fallback recommendations used while backend is unavailable.",
};

const MOCK_TRAIN: TrainResponse = {
  dataset_id: "mock-dataset-id",
  results: [
    { model_name: "Random Forest", accuracy: 0.97, precision: 0.97, recall: 0.97, f1_score: 0.97, training_time: 1.2 },
    { model_name: "XGBoost", accuracy: 0.95, precision: 0.95, recall: 0.94, f1_score: 0.95, training_time: 0.8 },
    { model_name: "Support Vector Machine", accuracy: 0.93, precision: 0.93, recall: 0.92, f1_score: 0.92, training_time: 0.5 },
  ],
};

const MOCK_DASHBOARD_SUMMARY: DashboardSummaryResponse = {
  datasets_processed: 3,
  experiments_run: 3,
  models_tested: 12,
  best_accuracy: 0.97,
  model_performance: [
    { model_name: "Random Forest", average_accuracy: 0.94 },
    { model_name: "SVM", average_accuracy: 0.89 },
    { model_name: "XGBoost", average_accuracy: 0.96 },
    { model_name: "Logistic Reg.", average_accuracy: 0.82 },
    { model_name: "KNN", average_accuracy: 0.85 },
  ],
};

const MOCK_KNOWLEDGE_BASE: KnowledgeBaseResponse = {
  rulebook: [
    "Use tree ensembles like Random Forest and XGBoost as strong defaults for mixed tabular data.",
    "Use Logistic Regression when interpretability matters.",
  ],
  entries: [],
};

async function apiFetch<T>(path: string, init: RequestInit, fallback: T): Promise<{ data: T; fallback: boolean }> {
  try {
    const response = await fetch(`${API_BASE}${path}`, init);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return { data: (await response.json()) as T, fallback: false };
  } catch (error) {
    if (!ENABLE_FALLBACK) {
      throw error;
    }
    return { data: fallback, fallback: true };
  }
}

export async function uploadDataset(file: File): Promise<{ data: UploadResponse; fallback: boolean }> {
  const formData = new FormData();
  formData.append("file", file);

  const mock: UploadResponse = {
    id: "mock-dataset-id",
    rows: 150,
    columns: 5,
    preview: MOCK_PREVIEW,
  };

  return apiFetch<UploadResponse>("/datasets/upload", { method: "POST", body: formData }, mock);
}

export async function analyzeDataset(
  datasetId: string,
  targetColumn: string,
  excludedColumns: string[] = [],
): Promise<{ data: AnalyzeResponse; fallback: boolean }> {
  const mock = { ...MOCK_ANALYSIS, dataset_id: datasetId || MOCK_ANALYSIS.dataset_id };

  return apiFetch<AnalyzeResponse>(
    "/datasets/analyze",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId, target_column: targetColumn, excluded_columns: excludedColumns }),
    },
    mock,
  );
}

export async function recommendModels(
  datasetId: string,
  userInstruction?: string,
  sampleData?: Record<string, string | number | null>[],
): Promise<{ data: RecommendResponse; fallback: boolean }> {
  const mock = { ...MOCK_RECOMMENDATION, dataset_id: datasetId || MOCK_RECOMMENDATION.dataset_id };

  return apiFetch<RecommendResponse>(
    "/models/recommend",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataset_id: datasetId,
        user_instruction: userInstruction || null,
        sample_data: sampleData ?? null,
      }),
    },
    mock,
  );
}

export async function trainModels(datasetId: string): Promise<{ data: TrainResponse; fallback: boolean }> {
  const mock = { ...MOCK_TRAIN, dataset_id: datasetId || MOCK_TRAIN.dataset_id };

  return apiFetch<TrainResponse>(
    "/models/train",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: datasetId }),
    },
    mock,
  );
}

export async function getDashboardSummary(): Promise<{ data: DashboardSummaryResponse; fallback: boolean }> {
  return apiFetch<DashboardSummaryResponse>(
    "/experiments/summary",
    { method: "GET" },
    MOCK_DASHBOARD_SUMMARY,
  );
}

export async function getKnowledgeBase(): Promise<{ data: KnowledgeBaseResponse; fallback: boolean }> {
  return apiFetch<KnowledgeBaseResponse>(
    "/models/knowledge-base",
    { method: "GET" },
    MOCK_KNOWLEDGE_BASE,
  );
}
