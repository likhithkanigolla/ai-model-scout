import { useEffect, useState } from "react";
import PageTransition from "@/components/PageTransition";
import MetricCard from "@/components/MetricCard";
import { Database, FlaskConical, Cpu, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { getDashboardSummary, type DashboardSummaryResponse } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      try {
        const { data, fallback } = await getDashboardSummary();
        if (cancelled) return;
        setSummary(data);
        if (fallback) {
          toast("Dashboard API unavailable: showing fallback metrics.");
        }
      } catch {
        if (!cancelled) {
          toast("Failed to load dashboard metrics.");
        }
      }
    };

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const datasetsProcessed = summary?.datasets_processed ?? 0;
  const experimentsRun = summary?.experiments_run ?? 0;
  const modelsTested = summary?.models_tested ?? 0;
  const bestAccuracy = summary?.best_accuracy ?? 0;
  const chartData = (summary?.model_performance ?? []).map((item) => ({
    name: item.model_name,
    accuracy: item.average_accuracy,
  }));

  return (
    <PageTransition>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="heading-display">Machine Learning Model Recommendation System</h1>
          <p className="body-light mt-1">Automated pipeline for dataset analysis and model selection</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard icon={Database} value={datasetsProcessed} label="Datasets Processed" delay={0} />
          <MetricCard icon={FlaskConical} value={experimentsRun} label="Experiments Run" delay={0.05} />
          <MetricCard icon={Cpu} value={modelsTested} label="Models Tested" delay={0.1} />
          <MetricCard icon={Target} value={`${(bestAccuracy * 100).toFixed(0)}%`} label="Best Accuracy" delay={0.15} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="card-static p-6"
        >
          <h2 className="heading-section mb-6">Model Performance Overview</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-active)" }}
                  formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, "Accuracy"]}
                />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
