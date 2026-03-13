import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import { Upload, FileSpreadsheet, Rows3, Columns3, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/sonner";
import { usePipeline } from "@/store/pipeline";
import type { DatasetInfo } from "@/types/pipeline";
import { uploadDataset } from "@/lib/api";

export default function UploadDataset() {
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { setDataset, setStep, dataset } = usePipeline();

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const { data, fallback } = await uploadDataset(file);
      const previewColumns = data.preview.length > 0 ? Object.keys(data.preview[0]) : [];
      const targetColumn = previewColumns.length > 0 ? previewColumns[previewColumns.length - 1] : "target";

      const info: DatasetInfo = {
        id: data.id,
        name: file.name,
        rows: data.rows,
        columns: data.columns,
        targetColumn,
        excludedColumns: [],
        preview: data.preview,
        numericFeatures: 0,
        categoricalFeatures: 0,
        missingPercentage: 0,
        classImbalance: 0,
        includedColumns: previewColumns.filter((column) => column !== targetColumn),
        columnProfiles: [],
      };

      setFileName(file.name);
      setUploaded(true);
      setDataset(info);
      setStep("uploaded");

      if (fallback) {
        toast("Backend unavailable: using fallback dataset preview.");
      } else {
        toast("Dataset uploaded successfully.");
      }
    } catch {
      toast("Dataset upload failed. Please check backend and try again.");
    } finally {
      setUploading(false);
    }
  }, [setDataset, setStep]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const startAnalysis = () => {
    setStep("analyzing");
    navigate("/analysis");
  };

  const columns = uploaded && dataset?.preview?.[0] ? Object.keys(dataset.preview[0]) : [];

  return (
    <PageTransition>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="heading-display">Upload Dataset</h1>
          <p className="body-light mt-1">Drag and drop your CSV file to begin</p>
        </div>

        <AnimatePresence mode="wait">
          {!uploaded ? (
            <motion.label
              key="dropzone"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`card-static flex flex-col items-center justify-center py-24 cursor-pointer border-2 border-dashed transition-colors ${
                dragging ? "border-primary bg-sidebar-accent" : "border-border"
              }`}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-foreground">
                {uploading ? "Uploading dataset..." : "Upload your dataset (CSV format)"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Drag & drop or click to browse</p>
              <input type="file" accept=".csv" className="hidden" onChange={onFileInput} disabled={uploading} />
            </motion.label>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="card-static p-5 flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{fileName}</span>
                <span className="text-xs text-muted-foreground ml-auto">Uploaded successfully</span>
              </div>

              <div className="card-static overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        {columns.map((col) => (
                          <th key={col} className="px-4 py-3 text-left font-medium text-muted-foreground">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(dataset?.preview ?? []).map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          {columns.map((col) => (
                            <td key={col} className="px-4 py-2.5 text-foreground">{String(row[col as keyof typeof row] ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="card-static p-4 flex items-center gap-3">
                  <Rows3 className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">{dataset?.rows ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Rows</p>
                  </div>
                </div>
                <div className="card-static p-4 flex items-center gap-3">
                  <Columns3 className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">{dataset?.columns ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Columns</p>
                  </div>
                </div>
                <div className="card-static p-4 flex items-center gap-3">
                  <Target className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">{dataset?.targetColumn ?? "target"}</p>
                    <p className="text-xs text-muted-foreground">Target column</p>
                  </div>
                </div>
              </div>

              <button
                onClick={startAnalysis}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Analyze Dataset
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
