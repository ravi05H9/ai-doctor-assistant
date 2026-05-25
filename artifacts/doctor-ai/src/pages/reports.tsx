import { useRef, useState } from "react";
import { useListReports, useAnalyzeReport, useDeleteReport } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FlaskConical,
  Scan,
  Pill,
  HelpCircle,
} from "lucide-react";
import type { ReportAnalysis, ReportFinding } from "@workspace/api-client-react";

const REPORT_TYPES = [
  { value: "blood_report", label: "Blood Report", icon: FlaskConical },
  { value: "xray", label: "X-Ray / Scan", icon: Scan },
  { value: "prescription", label: "Prescription", icon: Pill },
  { value: "other", label: "Other", icon: HelpCircle },
] as const;

type ReportType = (typeof REPORT_TYPES)[number]["value"];

const LANGUAGES = ["English", "Hindi", "Telugu"] as const;

function statusBadge(status: ReportFinding["status"]) {
  if (status === "normal")
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 gap-1">
        <CheckCircle className="h-3 w-3" /> Normal
      </Badge>
    );
  if (status === "abnormal")
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
        <AlertCircle className="h-3 w-3" /> Abnormal
      </Badge>
    );
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
      <AlertTriangle className="h-3 w-3" /> Borderline
    </Badge>
  );
}

function ReportCard({ report, onDelete }: { report: ReportAnalysis; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = REPORT_TYPES.find((t) => t.value === report.reportType);
  const Icon = typeInfo?.icon ?? FileText;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                {typeInfo?.label ?? report.reportType}
                {report.fileName && (
                  <span className="text-muted-foreground font-normal text-sm ml-1">— {report.fileName}</span>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(report.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(report.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-foreground leading-relaxed mt-2">{report.summary}</p>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground h-8"
          onClick={() => setExpanded((v) => !v)}
        >
          <span>{expanded ? "Hide" : "Show"} detailed findings</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {expanded && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {report.findings.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Findings</h4>
                <div className="space-y-2">
                  {report.findings.map((f, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-medium text-sm">{f.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{f.value}</span>
                          {statusBadge(f.status)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{f.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                <ul className="space-y-1.5">
                  {report.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const { data: reports = [], isLoading, refetch } = useListReports();
  const { mutateAsync: analyzeReport } = useAnalyzeReport();
  const { mutateAsync: deleteReport } = useDeleteReport();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedType, setSelectedType] = useState<ReportType>("blood_report");
  const [selectedLanguage, setSelectedLanguage] = useState<(typeof LANGUAGES)[number]>("English");
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<{ name: string; base64: string } | null>(null);

  function handleFileRead(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview({ name: file.name, base64: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileRead(file);
  }

  async function handleAnalyze() {
    if (!preview) return;
    setIsAnalyzing(true);
    try {
      await analyzeReport({
        data: {
          imageBase64: preview.base64,
          reportType: selectedType,
          fileName: preview.name,
          language: selectedLanguage,
        },
      });
      toast({ title: "Analysis complete", description: "Your report has been analyzed successfully." });
      setPreview(null);
      refetch();
    } catch {
      toast({ title: "Analysis failed", description: "Could not analyze the report. Please try again.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteReport({ id });
      toast({ title: "Report deleted" });
      refetch();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Analyzer</h1>
        <p className="text-muted-foreground mt-1">
          Upload a blood test, X-ray, or prescription image and get a plain-language explanation.
        </p>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload a Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Report type selector */}
          <div>
            <p className="text-sm font-medium mb-2">Report type</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {REPORT_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setSelectedType(t.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectedType === t.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium">Response language:</p>
            <div className="flex gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedLanguage === lang
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
          {!preview ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <div className="p-3 bg-muted rounded-full">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Drop your report image here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse — JPG, PNG, WebP supported</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileRead(f); }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border bg-muted/30 max-h-64 flex items-center justify-center">
                <img src={preview.base64} alt="Report preview" className="max-h-64 object-contain w-full" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground truncate">{preview.name}</p>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setPreview(null)} disabled={isAnalyzing}>
                    Remove
                  </Button>
                  <Button size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <FlaskConical className="h-4 w-4 mr-2" />
                        Analyze Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            AI analysis is for informational purposes only. Always consult a qualified doctor for medical decisions.
          </p>
        </CardContent>
      </Card>

      {/* Past analyses */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Past Analyses</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No reports analyzed yet</p>
            <p className="text-sm mt-1">Upload your first report above to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
