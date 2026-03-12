import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  value: string | number;
  label: string;
  delay?: number;
}

export default function MetricCard({ icon: Icon, value, label, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="card-elevated p-6 flex flex-col gap-3"
    >
      <div className="h-9 w-9 rounded-lg bg-sidebar-accent flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="metric-value">{value}</p>
        <p className="metric-label mt-1">{label}</p>
      </div>
    </motion.div>
  );
}
