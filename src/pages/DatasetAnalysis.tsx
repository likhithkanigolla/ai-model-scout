import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import MetricCard from "@/components/MetricCard";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Rows3, Columns3, Hash, Type, AlertTriangle, Scale, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "@/components/ui/sonner";
import { usePipeline } from "@/store/pipeline";
import { analyzeDataset } from "@/lib/api";

const analysisSteps = [
  "Extracting dataset metadata",
  "Analyzing dataset structure",
  "Detecting feature types",
  "Calculating statistical metrics",
];

const STEP_ANIMATION_MS = 2200;
const COMPLETE_DELAY_MS = 900;

const PIE_COLORS = ["hsl(217, 91%, 53%)", "hsl(217, 91%, 70%)", "hsl(217, 91%, 85%)"];

export default function DatasetAnalysis() {
  const { step, setStep, dataset, setDataset } = usePipeline();
  const navigate = useNavigate();
  const redirectedRef = useRef(false);
  const analysisRunKeyRef = useRef<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [apiFinished, setApiFinished] = useState(false);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [localTargetColumn, setLocalTargetColumn] = useState(dataset?.targetColumn ?? "");
  const [localExcludedColumns, setLocalExcludedColumns] = useState<string[]>(dataset?.excludedColumns ?? []);
  const [done, setDone] = useState(
    step === "analyzed" || step === "configuring" || step === "recommending" || step === "recommended" || step === "training" || step === "trained" || step === "complete"
  );

  useEffect(() => {
    setLocalTargetColumn(dataset?.targetColumn ?? "");
    setLocalExcludedColumns(dataset?.excludedColumns ?? []);
  }, [dataset?.id, dataset?.targetColumn, dataset?.excludedColumns]);

  useEffect(() => {
    if (!dataset && !redirectedRef.current) {
      redirectedRef.current = true;
      toast("Please upload a dataset first.");
      navigate("/upload");
    }
  }, [dataset, navigate]);

  useEffect(() => {
    if (!dataset) {
      analysisRunKeyRef.current = null;
      return;
    }

    // When this page is opened directly (e.g. from sidebar), kick off analysis automatically.
    if (step === "uploaded") {
      analysisRunKeyRef.current = null;
      setDone(false);
      setCurrentStep(0);
      setApiFinished(false);
      setAnimationFinished(false);
      setStep("analyzing");
      return;
    }

    if (step !== "analyzing") {
      return;
    }

    const runKey = `${dataset.id}:${dataset.targetColumn}:${[...(dataset.excludedColumns ?? [])].sort().join("|")}`;
    if (analysisRunKeyRef.current === runKey) {
      return;
    }
    analysisRunKeyRef.current = runKey;
    setDone(false);
    setCurrentStep(0);
    setApiFinished(false);
    setAnimationFinished(false);

    let cancelled = false;
    let completeTimer: NodeJS.Timeout | null = null;

    const timers: NodeJS.Timeout[] = [];
    analysisSteps.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setCurrentStep(i + 1);
      }, (i + 1) * STEP_ANIMATION_MS));
    });
    timers.push(setTimeout(() => {
      setAnimationFinished(true);
    }, analysisSteps.length * STEP_ANIMATION_MS + 200));

    const runAnalysis = async () => {
      try {
        const { data, fallback } = await analyzeDataset(dataset.id, dataset.targetColumn, dataset.excludedColumns ?? []);
        if (cancelled) return;

        setDataset({
          ...dataset,
          rows: data.number_of_samples,
          columns: (data.included_columns?.length ?? data.number_of_features) + (data.excluded_columns?.length ?? 0) + 1,
          numericFeatures: data.numeric_feature_count,
          categoricalFeatures: data.categorical_feature_count,
          missingPercentage: Number((data.missing_value_ratio * 100).toFixed(2)),
          classImbalance: data.imbalance_ratio,
          classDistribution: data.class_distribution,
          excludedColumns: data.excluded_columns,
          includedColumns: data.included_columns,
          columnProfiles: data.column_profiles.map((profile) => ({
            name: profile.name,
            dataType: profile.data_type,
            missingRatio: profile.missing_ratio,
            uniqueCount: profile.unique_count,
          })),
        });

        if (fallback) {
          toast("Analyze API unavailable: showing fallback analysis.");
        }
      } catch {
        if (!cancelled) {
          toast("Dataset analysis failed.");
        }
      } finally {
        if (!cancelled) {
          completeTimer = setTimeout(() => {
            setApiFinished(true);
          }, COMPLETE_DELAY_MS);
        }
      }
    };

    runAnalysis();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (completeTimer) clearTimeout(completeTimer);
    };
  }, [step, setStep, dataset?.id, dataset?.targetColumn, setDataset]);

  useEffect(() => {
    if (step === "analyzing" && apiFinished && animationFinished) {
      setDone(true);
      setStep("analyzed");
    }
  }, [step, apiFinished, animationFinished, setStep]);

  const allColumns = dataset?.preview?.[0] ? Object.keys(dataset.preview[0]) : [];
  const appliedExcludedColumns = dataset?.excludedColumns ?? [];
  const dirtyConfiguration = localTargetColumn !== (dataset?.targetColumn ?? "")
    || [...localExcludedColumns].sort().join("|") !== [...appliedExcludedColumns].sort().join("|");
  const featureMixData = [
    { name: "Numeric", count: dataset?.numericFeatures ?? 0 },
    { name: "Categorical", count: dataset?.categoricalFeatures ?? 0 },
  ];
  const columnProfileData = [...(dataset?.columnProfiles ?? [])]
    .sort((left, right) => right.missingRatio - left.missingRatio || right.uniqueCount - left.uniqueCount)
    .slice(0, 8)
    .map((profile) => ({
      name: profile.name.length > 14 ? `${profile.name.slice(0, 14)}…` : profile.name,
      missing: Number((profile.missingRatio * 100).toFixed(2)),
      unique: profile.uniqueCount,
    }));
  const classDistData = Object.entries(dataset?.classDistribution ?? { setosa: 0.333, versicolor: 0.333, virginica: 0.333 })
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value: Number((value * 100).toFixed(2)) }));

  const toggleExcludedColumn = (column: string) => {
    if (column === localTargetColumn) {
      return;
    }

    setLocalExcludedColumns((current) => (
      current.includes(column)
        ? current.filter((item) => item !== column)
        : [...current, column]
    ));
  };

  const handleTargetChange = (targetColumn: string) => {
    setLocalTargetColumn(targetColumn);
    setLocalExcludedColumns((current) => current.filter((column) => column !== targetColumn));
  };

  const rerunAnalysis = () => {
    if (!dataset) {
      return;
    }

    const nextExcludedColumns = localExcludedColumns.filter((column) => column !== localTargetColumn);
    setDataset({
      ...dataset,
      targetColumn: localTargetColumn,
      excludedColumns: nextExcludedColumns,
    });
    setStep("analyzing");
  };

  return (
    <PageTransition>
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="heading-display">Dataset Analysis</h1>
          <p className="body-light mt-1">{done ? "Analysis complete" : "Analyzing your dataset..."}</p>
        </div>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card-static p-8">
              <div className="space-y-6">
                {analysisSteps.map((label, i) => {
                  const completed = currentStep > i;
                  const active = currentStep === i;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : active ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-border" />
                      )}
                      <span className={`text-sm font-medium ${completed || active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                      {(completed || active) && (
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden ml-4">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: completed ? "100%" : "60%" }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="card-static p-6 space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="heading-section">Column Setup</h3>
                    <p className="text-sm text-muted-foreground mt-1">Exclude columns, adjust the target, and rerun analysis before asking the LLM for recommendations.</p>
                  </div>
                  <button
                    onClick={rerunAnalysis}
                    disabled={!dataset || !localTargetColumn || !dirtyConfiguration}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Re-run Analysis
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 items-start">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Target Column</label>
                    <select
                      value={localTargetColumn}
                      onChange={(e) => handleTargetChange(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {allColumns.map((column) => (
                        <option key={column} value={column}>{column}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">Applied exclusions: {appliedExcludedColumns.length}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Columns to Exclude</p>
                    <div className="flex flex-wrap gap-2">
                      {allColumns.map((column) => {
                        const isTarget = column === localTargetColumn;
                        const excluded = localExcludedColumns.includes(column);

                        return (
                          <button
                            key={column}
                            onClick={() => toggleExcludedColumn(column)}
                            disabled={isTarget}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                              isTarget
                                ? "border-primary/30 bg-primary/10 text-primary cursor-not-allowed"
                                : excluded
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                            }`}
                          >
                            {column}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard icon={Rows3} value={dataset?.rows ?? 150} label="Samples" delay={0} />
                <MetricCard icon={Columns3} value={(dataset?.includedColumns?.length ?? (dataset ? Math.max(dataset.columns - 1, 0) : 4))} label="Active Features" delay={0.05} />
                <MetricCard icon={Hash} value={dataset?.numericFeatures ?? 4} label="Numeric Features" delay={0.1} />
                <MetricCard icon={Type} value={dataset?.categoricalFeatures ?? 1} label="Categorical Features" delay={0.15} />
                <MetricCard icon={AlertTriangle} value={`${dataset?.missingPercentage ?? 0}%`} label="Missing Values" delay={0.2} />
                <MetricCard icon={Scale} value={`${(dataset?.classImbalance ?? 1).toFixed(2)}x`} label="Imbalance Ratio" delay={0.25} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-static p-6">
                  <h3 className="heading-section mb-4">Feature Type Mix</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={featureMixData} barSize={56}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-static p-6">
                  <h3 className="heading-section mb-4">Class Distribution</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={classDistData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name }) => name}>
                          {classDistData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-static p-6">
                <h3 className="heading-section mb-4">Column Quality Snapshot</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={columnProfileData} barGap={10}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                      <Bar yAxisId="left" dataKey="missing" name="Missing %" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      <Bar yAxisId="right" dataKey="unique" name="Unique Values" fill="hsl(var(--primary) / 0.45)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <p className="text-xs text-muted-foreground text-center">Analysis complete. Continue when ready.</p>
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => { setStep("configuring"); navigate("/recommendation"); }}
                  className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Continue to Recommendations →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
