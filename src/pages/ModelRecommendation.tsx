import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Zap, Shield, BarChart3, MessageSquare, Send } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { usePipeline } from "@/store/pipeline";
import type { ModelRecommendation as MR } from "@/types/pipeline";
import { recommendModels } from "@/lib/api";

const thinkingSteps = [
  "Analyzing dataset characteristics",
  "Evaluating model suitability",
  "Generating recommendations",
];

const INSTRUCTION_EXAMPLES = [
  "Optimize for high recall — false negatives are costly",
  "Need a fast, interpretable model for production deployment",
  "Imbalanced classes — focus on minority class detection",
  "Prioritize accuracy, training time is not a concern",
];

function pickRandomRows<T>(rows: T[], minCount = 10, maxCount = 15): T[] {
  if (!rows.length) return [];
  const target = Math.min(rows.length, Math.max(minCount, Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount));
  const shuffled = [...rows];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, target);
}

export default function ModelRecommendation() {
  const { step, setStep, setRecommendations, recommendations, dataset, userInstruction, setUserInstruction } = usePipeline();
  const navigate = useNavigate();
  const [thinking, setThinking] = useState(step === "recommending");
  const [thinkStep, setThinkStep] = useState(0);
  const [recommendationStarted, setRecommendationStarted] = useState(false);
  const [localInstruction, setLocalInstruction] = useState(userInstruction);

  const enrichRecommendation = (name: string, reason: string, index: number): MR => {
    const strengthMap: Record<string, string[]> = {
      "Random Forest": ["Robust on tabular", "Low overfitting risk", "Feature importance"],
      XGBoost: ["High predictive power", "Regularized boosting", "Handles nonlinearity"],
      "Support Vector Machine": ["Strong decision margins", "Kernel-based", "High-dimensional support"],
      SVM: ["Strong decision margins", "Kernel-based", "High-dimensional support"],
      "Logistic Regression": ["Interpretable", "Fast baseline", "Stable training"],
      "K-Nearest Neighbors": ["Simple baseline", "Non-parametric", "Local structure aware"],
    };

    return {
      name,
      reason,
      strengths: strengthMap[name] ?? ["Works on tabular data", "General-purpose classifier", "Reliable baseline"],
      score: Number((0.95 - index * 0.03).toFixed(2)),
    };
  };

  const handleSubmitInstruction = () => {
    setUserInstruction(localInstruction);
    setStep("recommending");
  };

  useEffect(() => {
    if (step !== "recommending") {
      setRecommendationStarted(false);
    }
    if (step !== "recommending") {
      if (step === "recommended" || step === "training" || step === "trained" || step === "complete") {
        setThinking(false);
      }
      return;
    }
    if (!dataset || recommendationStarted) return;
    setRecommendationStarted(true);
    setThinking(true);

    const timers = thinkingSteps.map((_, i) =>
      setTimeout(() => setThinkStep(i + 1), (i + 1) * 1200)
    );

    const sampleData = dataset.preview ? pickRandomRows(dataset.preview, 10, 15) : undefined;

    const runRecommendation = async () => {
      try {
        const { data, fallback } = await recommendModels(dataset.id, userInstruction || undefined, sampleData);
        const mapped = data.models.map((name, index) => enrichRecommendation(name, data.reasoning, index));
        setRecommendations(mapped);
        if (fallback) {
          toast("Recommendation API unavailable: using fallback recommendations.");
        }
      } catch {
        toast("Model recommendation failed.");
      } finally {
        setTimeout(() => {
          setThinking(false);
          setStep("recommended");
        }, 800);
      }
    };

    runRecommendation();
    return () => timers.forEach(clearTimeout);
  }, [step, setStep, setRecommendations, dataset, userInstruction, recommendationStarted]);

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
          <p className="body-light mt-1">
            {step === "configuring"
              ? "Tell the AI what you want to optimise for"
              : thinking
              ? "AI is analysing your dataset..."
              : "Recommended models for your dataset"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "configuring" ? (
            // ── Instruction form ──────────────────────────────────────────────
            <motion.div
              key="configure"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="card-static p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h2 className="heading-section">Describe Your Task</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Optionally describe your objective so the AI can tailor its recommendations.
                  We'll also send 15 sample rows from your dataset for extra context.
                </p>

                <textarea
                  value={localInstruction}
                  onChange={(e) => setLocalInstruction(e.target.value)}
                  placeholder="e.g. I need a model that minimises false negatives for a medical diagnosis task. Interpretability matters."
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />

                <div className="flex flex-wrap gap-2">
                  {INSTRUCTION_EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setLocalInstruction(ex)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitInstruction}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  <Send className="h-4 w-4" />
                  Get AI Recommendations
                </button>
                <button
                  onClick={() => { setLocalInstruction(""); handleSubmitInstruction(); }}
                  className="px-6 py-3 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                  Skip — use defaults
                </button>
              </div>
            </motion.div>
          ) : thinking ? (
            // ── Thinking UI ───────────────────────────────────────────────────
            <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card-static p-8">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="heading-section">AI Model Recommendation</h2>
              </div>
              {userInstruction && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-sidebar-accent border border-border text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Your goal: </span>{userInstruction}
                </div>
              )}
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
            // ── Results ───────────────────────────────────────────────────────
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {(recommendations.length > 0 ? recommendations : []).map((model, i) => (
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
                disabled={recommendations.length === 0}
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
