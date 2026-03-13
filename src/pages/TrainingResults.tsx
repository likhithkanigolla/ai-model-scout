import { useEffect, useMemo, useState } from "react";
import PageTransition from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "@/components/ui/sonner";
import { usePipeline } from "@/store/pipeline";
import type { TrainingResult } from "@/types/pipeline";
import { trainModels } from "@/lib/api";

export default function TrainingResults() {
  const { step, setStep, setTrainingResults, setTrainingProgress, trainingProgress, addExperiment, dataset, recommendations, trainingResults } = usePipeline();
  const [training, setTraining] = useState(step === "training");
  const [showBest, setShowBest] = useState(step === "complete");
  const [trainStarted, setTrainStarted] = useState(false);

  const models = useMemo(
    () => (recommendations.length > 0 ? recommendations.map((r) => r.name) : ["Random Forest", "XGBoost", "Support Vector Machine"]),
    [recommendations]
  );

  useEffect(() => {
    if (step !== "training") {
      setTrainStarted(false);
    }
    if (step !== "training") {
      if (step === "trained" || step === "complete") setTraining(false);
      return;
    }
    if (!dataset || trainStarted) return;
    setTrainStarted(true);

    let progress: Record<string, number> = { ...trainingProgress };
    const interval = setInterval(() => {
      models.forEach((m, i) => {
        const current = progress[m] ?? 0;
        const speed = (i + 1) * 3 + Math.random() * 5;
        progress[m] = Math.min(current + speed, 100);
      });
      setTrainingProgress({ ...progress });
    }, 200);

    const runTraining = async () => {
      try {
        const { data, fallback } = await trainModels(dataset.id);
        const mapped: TrainingResult[] = data.results.map((r) => ({
          model: r.model_name,
          accuracy: r.accuracy,
          precision: r.precision,
          recall: r.recall,
          f1Score: r.f1_score,
          trainingTime: `${r.training_time.toFixed(2)}s`,
          artifactId: r.artifact_id ?? undefined,
          downloadUrl: r.download_url ?? undefined,
        }));

        setTrainingProgress(Object.fromEntries(models.map((m) => [m, 100])));
        setTrainingResults(mapped);

        const bestResult = mapped.reduce((best, current) => (current.accuracy > best.accuracy ? current : best), mapped[0]);
        addExperiment({
          id: Date.now().toString(),
          datasetName: dataset.name,
          datasetSize: dataset.rows,
          featureCount: dataset.numericFeatures + dataset.categoricalFeatures,
          bestModel: bestResult.model,
          accuracy: bestResult.accuracy,
          date: new Date().toISOString().split("T")[0],
        });

        if (fallback) {
          toast("Training API unavailable: showing fallback training results.");
        }
      } catch {
        toast("Model training failed.");
      } finally {
        clearInterval(interval);
        setTimeout(() => {
          setTraining(false);
          setStep("trained");
          setTimeout(() => {
            setStep("complete");
            setShowBest(true);
          }, 1600);
        }, 500);
      }
    };

    runTraining();

    return () => clearInterval(interval);
  }, [
    step,
    dataset,
    trainStarted,
    trainingProgress,
    models,
    setTrainingProgress,
    setTrainingResults,
    addExperiment,
    setStep,
  ]);

  const displayResults = trainingResults.length > 0 ? trainingResults : [];
  const best = displayResults.length > 0
    ? displayResults.reduce((top, item) => (item.accuracy > top.accuracy ? item : top), displayResults[0])
    : null;
  const accChart = displayResults.map((r) => ({ name: r.model, accuracy: r.accuracy }));
  const timeChart = displayResults.map((r) => ({ name: r.model, time: parseFloat(r.trainingTime) }));

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
              {showBest && best && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-elevated p-8 text-center border-primary/20">
                  <Trophy className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h2 className="text-xl font-semibold text-foreground">Best Performing Model</h2>
                  <p className="metric-value mt-2">{best.model}</p>
                  <p className="text-3xl font-bold text-primary mt-1">{(best.accuracy * 100).toFixed(1)}% Accuracy</p>
                  <p className="body-light mt-3 max-w-md mx-auto">Top model selected from live training metrics (or fallback if backend is unavailable).</p>
                </motion.div>
              )}

              <div className="card-static overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {["Model", "Accuracy", "Precision", "Recall", "F1 Score", "Training Time", "Download"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayResults.map((r, i) => (
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
                        <td className="px-5 py-3">
                          {r.downloadUrl ? (
                            <a
                              href={`/api${r.downloadUrl}`}
                              className="text-xs font-medium text-primary bg-sidebar-accent px-2.5 py-1 rounded-full"
                            >
                              Download
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unavailable</span>
                          )}
                        </td>
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
