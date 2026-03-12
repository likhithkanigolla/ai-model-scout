import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Zap, Shield, BarChart3 } from "lucide-react";
import { usePipeline } from "@/store/pipeline";
import type { ModelRecommendation as MR } from "@/types/pipeline";

const MOCK_RECOMMENDATIONS: MR[] = [
  { name: "Random Forest", reason: "Excellent for tabular datasets. Handles nonlinear feature interactions and is robust to overfitting.", strengths: ["High accuracy", "Feature importance", "Handles missing data"], score: 0.95 },
  { name: "XGBoost", reason: "Gradient boosting excels on structured data with strong generalization performance.", strengths: ["Fast training", "Regularization", "Handles imbalance"], score: 0.93 },
  { name: "SVM", reason: "Effective in high-dimensional spaces and works well when classes are clearly separable.", strengths: ["Kernel flexibility", "Memory efficient", "Effective margins"], score: 0.88 },
];

const thinkingSteps = [
  "Analyzing dataset characteristics",
  "Evaluating model suitability",
  "Generating recommendations",
];

export default function ModelRecommendation() {
  const { step, setStep, setRecommendations } = usePipeline();
  const navigate = useNavigate();
  const [thinking, setThinking] = useState(step === "recommending");
  const [thinkStep, setThinkStep] = useState(0);

  useEffect(() => {
    if (step !== "recommending") {
      if (step === "recommended" || step === "training" || step === "trained" || step === "complete") {
        setThinking(false);
      }
      return;
    }
    const timers = thinkingSteps.map((_, i) =>
      setTimeout(() => {
        setThinkStep(i + 1);
        if (i === thinkingSteps.length - 1) {
          setTimeout(() => {
            setThinking(false);
            setRecommendations(MOCK_RECOMMENDATIONS);
            setStep("recommended");
          }, 800);
        }
      }, (i + 1) * 1200)
    );
    return () => timers.forEach(clearTimeout);
  }, [step, setStep, setRecommendations]);

  const startTraining = () => {
    setStep("training");
    navigate("/results");
  };

  const strengthIcon = (i: number) => [Zap, Shield, BarChart3][i % 3];

  return (
    <PageTransition>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="heading-display">Model Recommendation</h1>
          <p className="body-light mt-1">{thinking ? "AI is analyzing your dataset..." : "Recommended models for your dataset"}</p>
        </div>

        <AnimatePresence mode="wait">
          {thinking ? (
            <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card-static p-8">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="heading-section">AI Model Recommendation</h2>
              </div>
              <div className="space-y-4">
                {thinkingSteps.map((label, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.2 }}
                    className="flex items-center gap-3"
                  >
                    {thinkStep > i ? (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    ) : thinkStep === i ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-border" />
                    )}
                    <span className={`text-sm ${thinkStep >= i ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {MOCK_RECOMMENDATIONS.map((model, i) => (
                <motion.div
                  key={model.name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="card-elevated p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{model.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{model.reason}</p>
                    </div>
                    <span className="text-xs font-medium text-primary bg-sidebar-accent px-3 py-1 rounded-full">
                      Score: {(model.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex gap-3 mt-4">
                    {model.strengths.map((s, j) => {
                      const Icon = strengthIcon(j);
                      return (
                        <div key={j} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                          <Icon className="h-3 w-3" /> {s}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
              <button
                onClick={startTraining}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Train Recommended Models
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
