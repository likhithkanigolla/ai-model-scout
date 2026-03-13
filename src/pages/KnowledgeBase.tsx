import { useEffect, useMemo, useState } from "react";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/sonner";
import { getKnowledgeBase, type KnowledgeBaseEntry } from "@/lib/api";

export default function KnowledgeBase() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [rulebook, setRulebook] = useState<string[]>([]);
  const [modelFilter, setModelFilter] = useState("");
  const [minAccuracy, setMinAccuracy] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadKnowledgeBase = async () => {
      try {
        const { data, fallback } = await getKnowledgeBase();
        if (cancelled) return;
        setEntries(data.entries);
        setRulebook(data.rulebook);
        if (fallback) {
          toast("Knowledge base API unavailable: showing fallback content.");
        }
      } catch {
        if (!cancelled) {
          toast("Failed to load knowledge base.");
        }
      }
    };

    loadKnowledgeBase();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => entries.filter((e) => {
    if (modelFilter && e.best_model !== modelFilter) return false;
    if (e.best_accuracy < minAccuracy) return false;
    return true;
  }), [entries, modelFilter, minAccuracy]);

  const uniqueModels = [...new Set(entries.map((e) => e.best_model))];

  return (
    <PageTransition>
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="heading-display">Knowledge Base</h1>
          <p className="body-light mt-1">System rulebook plus learned outcomes from previous recommendation and training cycles</p>
        </div>

        <div className="card-static p-6 space-y-4">
          <h2 className="heading-section">System Rulebook</h2>
          <div className="grid gap-3">
            {rulebook.map((rule, index) => (
              <div key={index} className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
                {rule}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground"
          >
            <option value="">All Models</option>
            {uniqueModels.map((m: string) => (
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
                {["Dataset", "Target", "Recommended", "Best Model", "Accuracy", "Top Pick Worked", "Date"].map((h) => (
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
                  <td className="px-5 py-3 font-medium text-foreground">{e.dataset_name}</td>
                  <td className="px-5 py-3 text-foreground">{e.target_column}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium text-primary bg-sidebar-accent px-2.5 py-1 rounded-full">{e.recommended_models.join(", ")}</span>
                  </td>
                  <td className="px-5 py-3 text-foreground">{e.best_model}</td>
                  <td className="px-5 py-3 text-foreground">{(e.best_accuracy * 100).toFixed(1)}%</td>
                  <td className="px-5 py-3 text-foreground">{e.top_recommendation_worked ? "Yes" : "No"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">No knowledge-base entries match the filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </div>
    </PageTransition>
  );
}
