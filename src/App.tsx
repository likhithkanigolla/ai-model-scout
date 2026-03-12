import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import AppSidebar from "@/components/AppSidebar";
import Dashboard from "@/pages/Dashboard";
import UploadDataset from "@/pages/UploadDataset";
import DatasetAnalysis from "@/pages/DatasetAnalysis";
import ModelRecommendation from "@/pages/ModelRecommendation";
import TrainingResults from "@/pages/TrainingResults";
import KnowledgeBase from "@/pages/KnowledgeBase";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 min-h-screen overflow-y-auto">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<UploadDataset />} />
                <Route path="/analysis" element={<DatasetAnalysis />} />
                <Route path="/recommendation" element={<ModelRecommendation />} />
                <Route path="/results" element={<TrainingResults />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
