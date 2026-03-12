import { useEffect, useState } from "react";
import PageTransition from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePipeline } from "@/store/pipeline";
import type { TrainingResult } from "@/types/pipeline";

const MOCK_RESULTS: TrainingResult[] = [
  { model: "Random Forest", accuracy: 0.97, precision: 0.97, recall: 0.97, f1Score: 0.97, trainingTime: "1.2s" },
  { model: "XGBoost", accuracy: 0.95, precision: 0.95, recall: 0.94, f1Score: 0.95, trainingTime: "0.8s" },
  { model: "SVM", accuracy: 0.93, precision: 0.93, recall: 0.92, f1Score: 0.92, trainingTime: "0.5s" },
];

const models = ["Random Forest", "XGBoost", "SVM"];

export default function TrainingResults() {
  const { step, setStep, setTrainingResults, setTrainingProgress, trainingProgress, addExperiment, dataset } = usePipeline();
  const [training, setTraining] = useState(step === "training");
  const [showBest, setShowBest] = useState(step === "complete");

  useEffect(() => {
    if (step !== "training") {
      if (step === "trained" || step === "complete") setTraining(false);
      return;
    }
    const interval = setInterval(() => {
      setTrainingProgress((prev: Record<string, number>) => {
        const next = { ...prev };
        let allDone = true;
        models.forEach((m, i) => {
          const current = next[m] ?? 0;
          const target = 100;
          const speed = (i + 1) * 3 + Math.random() * 5;
          next[m] = Math.min(current + speed, target);
          if (next[m] < target) allDone = false;
        });
        if (allDone) {
          clearInterval(interval);
          setTimeout(() => {
            setTraining(false);
            setTrainingResults(MOCK_RESULTS);
            setStep("trained");
            addExperiment({
              id: Date.now().toString(),
              datasetName: dataset?.name ?? "dataset.csv",
              datasetSize: dataset?.rows ?? 150,
              featureCount: dataset?.columns ?? 5,
              bestModel: "Random Forest",
              accuracy: 0.97,
              date: new Date().toISOString().split("T")[0],
            });
            setTimeout(() => {
              setStep("complete");
              setShowBest(true);
            }, 2000);
          }, 500);
        }
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [step]);

  const best = MOCK_RESULTS[0];
  const accChart = MOCK_RESULTS.map((r) => ({ name: r.model, accuracy: r.accuracy }));
  const timeChart = MOCK_RESULTS.map((r) => ({ name: r.model, time: parseFloat(r.trainingTime) }));

  return (
    <PageTransition>
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="heading-display">Training Results</h1>
          <p className="body-light mt-1">{training ? "Training models..." : "Model performance comparison"}</p>
        </div>

        <AnimatePresence mode="wait">
          {training ? (
            <motion.div key="training" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card-static p-8 space-y-6">
              {models.map((m, i) => (
                <motion.div key={m} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{m}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(trainingProgress[m] ?? 0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${trainingProgress[m] ?? 0}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {showBest && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-elevated p-8 text-center border-primary/20">
                  <Trophy className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h2 className="text-xl font-semibold text-foreground">Best Performing Model</h2>
                  <p className="metric-value mt-2">{best.model}</p>
                  <p className="text-3xl font-bold text-primary mt-1">{(best.accuracy * 100).toFixed(1)}% Accuracy</p>
                  <p className="body-light mt-3 max-w-md mx-auto">Random Forest achieved the highest accuracy with balanced precision and recall across all classes.</p>
                </motion.div>
              )}

              <div className="card-static overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Model", "Accuracy", "Precision", "Recall", "F1 Score", "Training Time"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_RESULTS.map((r, i) => (
                      <motion.tr
                        key={r.model}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-5 py-3 font-medium text-foreground">{r.model}</td>
                        <td className="px-5 py-3 text-foreground">{(r.accuracy * 100).toFixed(1)}%</td>
                        <td className="px-5 py-3 text-foreground">{(r.precision * 100).toFixed(1)}%</td>
                        <td className="px-5 py-3 text-foreground">{(r.recall * 100).toFixed(1)}%</td>
                        <td className="px-5 py-3 text-foreground">{(r.f1Score * 100).toFixed(1)}%</td>
                        <td className="px-5 py-3 text-muted-foreground">{r.trainingTime}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-static p-6">
                  <h3 className="heading-section mb-4">Accuracy Comparison</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={accChart} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0.8, 1]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, "Accuracy"]} />
                        <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-static p-6">
                  <h3 className="heading-section mb-4">Training Time</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timeChart} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} formatter={(v: number) => [`${v}s`, "Time"]} />
                        <Bar dataKey="time" fill="hsl(var(--primary) / 0.6)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
