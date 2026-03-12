import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import MetricCard from "@/components/MetricCard";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Rows3, Columns3, Hash, Type, AlertTriangle, Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { usePipeline } from "@/store/pipeline";

const analysisSteps = [
  "Extracting dataset metadata",
  "Analyzing dataset structure",
  "Detecting feature types",
  "Calculating statistical metrics",
];

const featureDistData = [
  { name: "0-2", count: 35 },
  { name: "2-4", count: 45 },
  { name: "4-6", count: 40 },
  { name: "6-8", count: 30 },
];

const classDistData = [
  { name: "setosa", value: 50 },
  { name: "versicolor", value: 50 },
  { name: "virginica", value: 50 },
];

const PIE_COLORS = ["hsl(217, 91%, 53%)", "hsl(217, 91%, 70%)", "hsl(217, 91%, 85%)"];

export default function DatasetAnalysis() {
  const { step, setStep, dataset } = usePipeline();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(step === "analyzed" || step === "recommended" || step === "trained" || step === "complete");

  useEffect(() => {
    if (step !== "analyzing") return;
    const timers: NodeJS.Timeout[] = [];
    analysisSteps.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setCurrentStep(i + 1);
        if (i === analysisSteps.length - 1) {
          setTimeout(() => {
            setDone(true);
            setStep("analyzed");
          }, 800);
        }
      }, (i + 1) * 1200));
    });
    return () => timers.forEach(clearTimeout);
  }, [step, setStep]);

  useEffect(() => {
    if (step === "analyzed" && done) {
      const t = setTimeout(() => {
        setStep("recommending");
        navigate("/recommendation");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [step, done, setStep, navigate]);

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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard icon={Rows3} value={dataset?.rows ?? 150} label="Samples" delay={0} />
                <MetricCard icon={Columns3} value={dataset?.columns ?? 5} label="Features" delay={0.05} />
                <MetricCard icon={Hash} value={dataset?.numericFeatures ?? 4} label="Numeric Features" delay={0.1} />
                <MetricCard icon={Type} value={dataset?.categoricalFeatures ?? 1} label="Categorical Features" delay={0.15} />
                <MetricCard icon={AlertTriangle} value={`${dataset?.missingPercentage ?? 0}%`} label="Missing Values" delay={0.2} />
                <MetricCard icon={Scale} value={`${((dataset?.classImbalance ?? 0.33) * 100).toFixed(0)}%`} label="Class Balance" delay={0.25} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-static p-6">
                  <h3 className="heading-section mb-4">Feature Distribution</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={featureDistData} barSize={32}>
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
                            <Cell key={i} fill={PIE_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

              <p className="text-xs text-muted-foreground text-center">Proceeding to model recommendation...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
