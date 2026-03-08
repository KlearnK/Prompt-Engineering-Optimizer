import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Sparkles, Copy, Download, Save, Zap, RefreshCw,
  Eye, Target, LayoutList, CheckSquare, MessageSquare, Shield,
  ChevronRight, BookOpen, Lightbulb, AlertCircle, CheckCircle2,
  ArrowRight, Wand2, FileText, Layers, X, Palette
} from "lucide-react";
import type { AssessmentResult, DimensionScore } from "../../../shared/promptData";
import { TECHNIQUES, QUALITY_DIMENSIONS } from "../../../shared/promptData";
import AppLayout from "@/components/AppLayout";
import TemplateLibrary from "@/components/TemplateLibrary";
import ModelConfigDialog from "@/components/ModelConfigDialog";
import { useModelConfig } from "@/contexts/ModelConfigContext";
import ApiKeyBanner from "@/components/ApiKeyBanner";
const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  clarity: <Eye className="w-4 h-4" />,
  specificity: <Target className="w-4 h-4" />,
  structure: <LayoutList className="w-4 h-4" />,
  completeness: <CheckSquare className="w-4 h-4" />,
  tone: <MessageSquare className="w-4 h-4" />,
  constraints: <Shield className="w-4 h-4" />,
};

const RATING_CONFIG = {
  Poor: { color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", bar: "bg-red-400", score: 1, label: "较差" },
  Fair: { color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", bar: "bg-amber-400", score: 2, label: "一般" },
  Good: { color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", bar: "bg-blue-400", score: 3, label: "良好" },
  Excellent: { color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", bar: "bg-emerald-400", score: 4, label: "优秀" },
};

const DIM_NAME_ZH: Record<string, string> = {
  clarity: "清晰度",
  specificity: "特异性",
  structure: "结构性",
  completeness: "完整性",
  tone: "语气",
  constraints: "约束性",
};

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 4) * 100;
  const color = score <= 1 ? "bg-red-400" : score <= 2 ? "bg-amber-400" : score <= 3 ? "bg-blue-400" : "bg-emerald-400";
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DimensionCard({ dim }: { dim: DimensionScore }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RATING_CONFIG[dim.rating as keyof typeof RATING_CONFIG] ?? RATING_CONFIG.Fair;
  const dimMeta = QUALITY_DIMENSIONS.find(d => d.id === dim.dimension);

  return (
    <div className={`border rounded-lg p-3 ${cfg.bg} transition-all`}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <span className={cfg.color}>{DIMENSION_ICONS[dim.dimension]}</span>
          <span className="text-sm font-medium text-foreground">{DIM_NAME_ZH[dim.dimension] ?? dimMeta?.name}</span>
          <span className="text-xs text-muted-foreground">/ {dimMeta?.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs ${cfg.color} border-current`}>{cfg.label}</Badge>
          <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>
      <div className="mt-2">
        <ScoreBar score={dim.score} />
      </div>
      {expanded && (
        <div className="mt-3 space-y-2 text-xs">
          {dim.strengths.length > 0 && (
            <div>
              <p className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
                <CheckCircle2 className="w-3 h-3" /> 优点
              </p>
              {dim.strengths.map((s, i) => <p key={i} className="text-muted-foreground pl-4">{s}</p>)}
            </div>
          )}
          {dim.weaknesses.length > 0 && (
            <div>
              <p className="font-medium text-red-500 flex items-center gap-1 mb-1">
                <AlertCircle className="w-3 h-3" /> 不足
              </p>
              {dim.weaknesses.map((w, i) => <p key={i} className="text-muted-foreground pl-4">{w}</p>)}
            </div>
          )}
          {dim.suggestions.length > 0 && (
            <div>
              <p className="font-medium text-blue-500 flex items-center gap-1 mb-1">
                <Lightbulb className="w-3 h-3" /> 改进建议
              </p>
              {dim.suggestions.map((s, i) => <p key={i} className="text-muted-foreground pl-4">{s}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OverallScore({ score, rating }: { score: number; rating: string }) {
  const cfg = RATING_CONFIG[rating as keyof typeof RATING_CONFIG] ?? RATING_CONFIG.Fair;
  const pct = (score / 4) * 100;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const strokeColor = rating === "Poor" ? "#f87171" : rating === "Fair" ? "#fbbf24" : rating === "Good" ? "#60a5fa" : "#34d399";

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
          <circle cx="40" cy="40" r="36" fill="none" stroke={strokeColor} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${cfg.color}`}>{score.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">/4.0</span>
        </div>
      </div>
      <div>
        <Badge className={`${cfg.color} border-current mb-1`} variant="outline">{cfg.label}</Badge>
        <p className="text-xs text-muted-foreground">综合质量评分</p>
      </div>
    </div>
  );
}

type SidebarPanel = "none" | "templates" | "uiKeywords";

export default function PromptOptimizer() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { isConfigured } = useModelConfig();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"assess" | "optimize" | null>(null);
  const [prompt, setPrompt] = useState("");
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [optimized, setOptimized] = useState("");
  const [activeTab, setActiveTab] = useState("editor");
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>("none");
  const [uiConversions, setUiConversions] = useState<any>(null);

  // 从历史记录页加载
  useEffect(() => {
    const saved = sessionStorage.getItem("promptcraft_load");
    if (saved) {
      setPrompt(saved);
      sessionStorage.removeItem("promptcraft_load");
    }
  }, []);

  const assessMutation = trpc.prompt.assess.useMutation({
    onSuccess: (data) => {
      setAssessment(data as AssessmentResult);
      setActiveTab("assessment");
      toast.success("评估完成！");
    },
    onError: () => toast.error("评估失败，请重试"),
  });

  const optimizeMutation = trpc.prompt.optimize.useMutation({
    onSuccess: (data) => {
      setOptimized(data.optimizedPrompt);
      setActiveTab("comparison");
      toast.success("提示词优化完成！");
    },
    onError: () => toast.error("优化失败，请重试"),
  });

  const convertUiMutation = trpc.prompt.convertUiKeywords.useMutation({
    onSuccess: (data) => {
      setUiConversions(data);
      setSidebarPanel("uiKeywords");
      toast.success(`发现 ${data.conversions?.length ?? 0} 个可改进的关键词！`);
    },
    onError: () => toast.error("转换失败，请重试"),
  });

  const saveMutation = trpc.history.save.useMutation({
    onSuccess: () => toast.success("已保存到历史记录！"),
    onError: () => toast.error("保存失败"),
  });

  // 当用户完成API Key配置后，自动执行待运行的操作
  useEffect(() => {
    if (isConfigured && pendingAction) {
      const configRaw = localStorage.getItem('modelConfig');
      const config = configRaw ? JSON.parse(configRaw) : null;
      const modelConfig = config?.apiKey ? {
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
      } : undefined;

      if (pendingAction === "assess" && prompt.trim()) {
        assessMutation.mutate({ prompt, config: modelConfig });
      } else if (pendingAction === "optimize" && assessment) {
        optimizeMutation.mutate({
          prompt,
          assessmentSummary: assessment.summary,
          recommendedTechniqueIds: assessment.recommendedTechniques,
          config: modelConfig,
        });
      }
      setPendingAction(null);
    }
  }, [isConfigured, pendingAction, prompt, assessment, assessMutation, optimizeMutation]);

  const handleAssess = useCallback(() => {
    if (!prompt.trim()) { toast.error("请先输入提示词"); return; }
    if (!isConfigured) {
      setPendingAction("assess");
      setConfigDialogOpen(true);
      return;
    }

const configRaw = localStorage.getItem('modelConfig');
    const config = configRaw ? JSON.parse(configRaw) : null;
    assessMutation.mutate({ 
      prompt,
      config: config?.apiKey ? {
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
      } : undefined,
    });
  }, [prompt, assessMutation, isConfigured]);

  const handleOptimize = useCallback(() => {
    if (!assessment) { toast.error("请先评估提示词"); return; }
    if (!isConfigured) {
      setPendingAction("optimize");
      setConfigDialogOpen(true);
      return;
    }

const configRaw = localStorage.getItem('modelConfig');
    const config = configRaw ? JSON.parse(configRaw) : null;
    optimizeMutation.mutate({
      prompt,
      assessmentSummary: assessment.summary,
      recommendedTechniqueIds: assessment.recommendedTechniques,
      config: config?.apiKey ? {
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
      } : undefined,
    });
  }, [prompt, assessment, optimizeMutation, isConfigured]);

  const handleConvertUi = useCallback(() => {
    if (!prompt.trim()) { toast.error("请先输入提示词"); return; }
const configRaw = localStorage.getItem('modelConfig');
    const config = configRaw ? JSON.parse(configRaw) : null;
    convertUiMutation.mutate({ 
      prompt,
      config: config?.apiKey ? {
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
      } : undefined,
    }); 
  }, [prompt, convertUiMutation]);

  const handleSave = useCallback(() => {
    if (!isAuthenticated) { toast.error("请先登录以保存历史记录"); return; }
    saveMutation.mutate({
      originalPrompt: prompt,
      optimizedPrompt: optimized || undefined,
      assessmentResult: assessment,
      appliedTechniques: assessment?.recommendedTechniques,
    });
  }, [isAuthenticated, prompt, optimized, assessment, saveMutation]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板！");
  }, []);

  const exportMarkdown = useCallback(() => {
    const md = `# 提示词优化报告\n\n## 原始提示词\n\`\`\`\n${prompt}\n\`\`\`\n\n## 优化后提示词\n\`\`\`\n${optimized}\n\`\`\`\n\n## 评估结果\n- 综合评分：${assessment?.overallScore}/4.0（${RATING_CONFIG[assessment?.overallRating as keyof typeof RATING_CONFIG]?.label ?? assessment?.overallRating}）\n- 评估摘要：${assessment?.summary}\n`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "prompt-optimization.md"; a.click();
    URL.revokeObjectURL(url);
    toast.success("已导出为 Markdown！");
  }, [prompt, optimized, assessment]);

  const exportText = useCallback(() => {
    const content = optimized || prompt;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "prompt.txt"; a.click();
    URL.revokeObjectURL(url);
    toast.success("已导出为纯文本！");
  }, [prompt, optimized]);

  const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;
  const charCount = prompt.length;

  const toggleSidebar = (panel: SidebarPanel) => {
    setSidebarPanel(prev => prev === panel ? "none" : panel);
  };

  return (
    <AppLayout>
        <ApiKeyBanner />
        <div className="flex flex-col h-full">
        {/* 工具栏 */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-primary" /> 提示词优化器
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant={sidebarPanel === "templates" ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleSidebar("templates")}
              className="gap-1.5 text-xs h-7"
            >
              <Layers className="w-3.5 h-3.5" /> 模板库
            </Button>
            <Button
              variant={sidebarPanel === "uiKeywords" ? "secondary" : "outline"}
              size="sm"
              onClick={() => { if (sidebarPanel === "uiKeywords") { setSidebarPanel("none"); } else { handleConvertUi(); } }}
              disabled={convertUiMutation.isPending}
              className="gap-1.5 text-xs h-7"
            >
              {convertUiMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Palette className="w-3.5 h-3.5" />}
              UI关键词
            </Button>
            {(optimized || assessment) && (
              <>
                <div className="h-4 w-px bg-border mx-0.5" />
                <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMutation.isPending} className="gap-1.5 text-xs h-7">
                  <Save className="w-3.5 h-3.5" /> 保存
                </Button>
                {optimized && (
                  <>
                    <Button variant="outline" size="sm" onClick={exportMarkdown} className="gap-1.5 text-xs h-7">
                      <Download className="w-3.5 h-3.5" /> .md
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportText} className="gap-1.5 text-xs h-7">
                      <FileText className="w-3.5 h-3.5" /> .txt
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧：编辑器 + 标签页 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-4 pt-2.5 border-b border-border">
                <TabsList className="h-7">
                  <TabsTrigger value="editor" className="text-xs gap-1.5 h-6">
                    <FileText className="w-3 h-3" /> 编辑器
                  </TabsTrigger>
                  <TabsTrigger value="assessment" className="text-xs gap-1.5 h-6" disabled={!assessment}>
                    <Layers className="w-3 h-3" /> 评估结果
                    {assessment && <Badge variant="secondary" className="text-xs ml-1 px-1 py-0 h-4">{RATING_CONFIG[assessment.overallRating as keyof typeof RATING_CONFIG]?.label ?? assessment.overallRating}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="text-xs gap-1.5 h-6" disabled={!optimized}>
                    <ArrowRight className="w-3 h-3" /> 对比视图
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* 编辑器标签页 */}
              <TabsContent value="editor" className="flex-1 flex flex-col overflow-hidden m-0 p-4 gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {wordCount} 词 · {charCount} 字符
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAssess}
                      disabled={assessMutation.isPending || !prompt.trim()}
                      className="gap-1.5 text-xs h-7"
                    >
                      {assessMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      {assessMutation.isPending ? "评估中..." : "评估质量"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleOptimize}
                      disabled={optimizeMutation.isPending || !assessment}
                      className="gap-1.5 text-xs h-7"
                    >
                      {optimizeMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {optimizeMutation.isPending ? "优化中..." : "一键优化"}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`在此输入你的提示词...\n\n示例：写一篇关于人工智能的博客文章\n\n提示：点击「评估质量」从6个维度分析你的提示词，然后点击「一键优化」生成改进版本。`}
                  className="flex-1 resize-none font-mono text-sm leading-relaxed min-h-[300px]"
                />
                {!assessment && prompt.trim() && (
                  <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground">
                    <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p>准备好了！点击 <strong className="text-foreground">评估质量</strong> 从6个维度分析你的提示词。</p>
                  </div>
                )}
              </TabsContent>

              {/* 评估结果标签页 */}
              <TabsContent value="assessment" className="flex-1 overflow-y-auto m-0 p-4">
                {assessment && (
                  <div className="space-y-4">
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground">综合评估</h3>
                        <Button size="sm" onClick={handleOptimize} disabled={optimizeMutation.isPending} className="gap-1.5 text-xs h-7">
                          {optimizeMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                          {optimizeMutation.isPending ? "优化中..." : "一键优化"}
                        </Button>
                      </div>
                      <div className="flex items-start gap-4">
                        <OverallScore score={assessment.overallScore} rating={assessment.overallRating} />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground leading-relaxed">{assessment.summary}</p>
                          {assessment.topWeaknesses.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-foreground mb-1">主要问题：</p>
                              <ul className="space-y-1">
                                {assessment.topWeaknesses.map((w, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <span className="text-red-400 mt-0.5">•</span> {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">维度详情</h3>
                      <div className="space-y-2">
                        {assessment.dimensions.map((dim) => (
                          <DimensionCard key={dim.dimension} dim={dim} />
                        ))}
                      </div>
                    </div>

                    {assessment.recommendedTechniques.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-foreground">推荐技巧</h3>
                          <Button variant="ghost" size="sm" onClick={() => navigate("/techniques")} className="text-xs gap-1 h-6">
                            <BookOpen className="w-3 h-3" /> 查看全部58个
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {assessment.recommendedTechniques.slice(0, 8).map((id) => {
                            const t = TECHNIQUES.find(t => t.id === id);
                            if (!t) return null;
                            return (
                              <Badge key={id} variant="outline" className="text-xs gap-1 cursor-default">
                                <span className="text-primary font-mono">#{id}</span> {t.nameZh}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* 对比视图标签页 */}
              <TabsContent value="comparison" className="flex-1 overflow-hidden m-0">
                {optimized && (
                  <div className="flex h-full">
                    <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-red-50/50 dark:bg-red-950/20 border-b border-border">
                        <span className="text-xs font-medium text-red-600 dark:text-red-400">原始提示词</span>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(prompt)} className="h-6 text-xs gap-1">
                          <Copy className="w-3 h-3" /> 复制
                        </Button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        <pre className="text-sm font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">{prompt}</pre>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-border">
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">优化后提示词</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(optimized)} className="h-6 text-xs gap-1">
                            <Copy className="w-3 h-3" /> 复制
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setPrompt(optimized);
                            setActiveTab("editor");
                            setAssessment(null);
                            setOptimized("");
                          }} className="h-6 text-xs gap-1 text-primary">
                            <RefreshCw className="w-3 h-3" /> 使用此版本
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        <pre className="text-sm font-mono whitespace-pre-wrap text-foreground leading-relaxed">{optimized}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* 右侧面板：模板库 / UI关键词 / 快捷操作 */}
          <div className={`border-l border-border bg-card/30 flex flex-col overflow-hidden transition-all duration-200 ${sidebarPanel !== "none" ? "w-72" : "w-52"}`}>
            {sidebarPanel === "templates" ? (
              <TemplateLibrary
                onApply={(template) => { setPrompt(template); setActiveTab("editor"); setAssessment(null); setOptimized(""); }}
                onClose={() => setSidebarPanel("none")}
              />
            ) : sidebarPanel === "uiKeywords" && uiConversions ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">UI关键词转换</h2>
                    <Badge variant="secondary" className="text-xs">{uiConversions.conversions?.length ?? 0}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSidebarPanel("none")} className="h-7 w-7 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {uiConversions.conversions?.length > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground">将模糊描述替换为专业UI/UX术语：</p>
                      {uiConversions.conversions.map((conv: any, i: number) => (
                        <div key={i} className="bg-card border border-border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-mono line-through">{conv.original}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-mono">{conv.suggested}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{conv.reason}</p>
                        </div>
                      ))}
                      {uiConversions.enhancedPrompt && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-foreground">增强后的提示词</p>
                            <Button size="sm" className="h-6 text-xs gap-1" onClick={() => {
                              setPrompt(uiConversions.enhancedPrompt);
                              setActiveTab("editor");
                              setAssessment(null);
                              setOptimized("");
                              setSidebarPanel("none");
                              toast.success("已应用增强提示词！");
                            }}>
                              应用 <ArrowRight className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-3 font-mono text-xs text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {uiConversions.enhancedPrompt}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Palette className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">未发现模糊UI术语，你的提示词已使用专业术语！</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 默认快捷操作面板 */
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">快捷操作</p>
                </div>
                <div className="p-3 space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-8" onClick={() => toggleSidebar("templates")}>
                    <Layers className="w-3.5 h-3.5 text-primary" /> 浏览模板库
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-8" onClick={() => navigate("/techniques")}>
                    <BookOpen className="w-3.5 h-3.5 text-violet-500" /> 58个优化技巧
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-8" onClick={() => navigate("/learn")}>
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> 学习模块
                  </Button>
                  {isAuthenticated && (
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-8" onClick={() => navigate("/history")}>
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" /> 查看历史
                    </Button>
                  )}
                </div>

                {assessment && (
                  <div className="p-3 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">各维度评分</p>
                    <div className="space-y-2">
                      {assessment.dimensions.map((dim) => {
                        const cfg = RATING_CONFIG[dim.rating as keyof typeof RATING_CONFIG] ?? RATING_CONFIG.Fair;
                        return (
                          <div key={dim.dimension} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{DIM_NAME_ZH[dim.dimension]}</span>
                              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <ScoreBar score={dim.score} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ModelConfigDialog
        open={configDialogOpen}
        onOpenChange={(open) => {
          setConfigDialogOpen(open);
          if (!open) setPendingAction(null);
        }}
        onConfigured={() => {
          // 配置完成后对话框关闭，useEffect会自动执行待运行操作
          setConfigDialogOpen(false);
        }}
      />
    </AppLayout>
  );
}
