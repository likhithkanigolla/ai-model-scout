import { useState } from "react";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";
import { usePipeline } from "@/store/pipeline";

export default function KnowledgeBase() {
  const experiments = usePipeline((s) => s.experiments);
  const [modelFilter, setModelFilter] = useState("");
  const [minAccuracy, setMinAccuracy] = useState(0);

  const filtered = experiments.filter((e) => {
    if (modelFilter && e.bestModel !== modelFilter) return false;
    if (e.accuracy < minAccuracy) return false;
    return true;
  });

  const uniqueModels = [...new Set(experiments.map((e) => e.bestModel))];

  return (
    <PageTransition>
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="heading-display">Knowledge Base</h1>
          <p className="body-light mt-1">Historical experiments and results</p>
        </div>

        <div className="flex gap-4">
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground"
          >
            <option value="">All Models</option>
            {uniqueModels.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={minAccuracy}
            onChange={(e) => setMinAccuracy(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground"
          >
            <option value={0}>Min Accuracy: Any</option>
            <option value={0.8}>≥ 80%</option>
            <option value={0.9}>≥ 90%</option>
            <option value={0.95}>≥ 95%</option>
          </select>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-static overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Dataset", "Size", "Features", "Best Model", "Accuracy", "Date"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-5 py-3 font-medium text-foreground">{e.datasetName}</td>
                  <td className="px-5 py-3 text-foreground">{e.datasetSize}</td>
                  <td className="px-5 py-3 text-foreground">{e.featureCount}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium text-primary bg-sidebar-accent px-2.5 py-1 rounded-full">{e.bestModel}</span>
                  </td>
                  <td className="px-5 py-3 text-foreground">{(e.accuracy * 100).toFixed(1)}%</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.date}</td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No experiments match the filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </PageTransition>
  );
}
