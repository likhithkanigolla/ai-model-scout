import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, BarChart3, Cpu, FlaskConical, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Upload Dataset", path: "/upload", icon: Upload },
  { label: "Dataset Analysis", path: "/analysis", icon: BarChart3 },
  { label: "Model Recommendation", path: "/recommendation", icon: Cpu },
  { label: "Training Results", path: "/results", icon: FlaskConical },
  { label: "Knowledge Base", path: "/knowledge", icon: BookOpen },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-card border-r border-border flex flex-col">
      <div className="px-6 py-6">
        <h1 className="text-sm font-semibold text-foreground tracking-tight leading-tight">
          LLM-Assisted ML<br />
          <span className="text-muted-foreground font-normal text-xs">Model Recommendation</span>
        </h1>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "text-primary bg-sidebar-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">v1.0 · Powered by AI</p>
      </div>
    </aside>
  );
}
