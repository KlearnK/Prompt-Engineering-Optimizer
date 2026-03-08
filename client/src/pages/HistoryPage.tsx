import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  History, Search, Trash2, Copy, Eye, EyeOff,
  Calendar, Sparkles, FileText, ArrowRight, LogIn
} from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import AppLayout from "@/components/AppLayout";

const RATING_COLORS: Record<string, string> = {
  Poor: "text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200",
  Fair: "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200",
  Good: "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200",
  Excellent: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200",
};

const RATING_ZH: Record<string, string> = {
  Poor: "较差",
  Fair: "一般",
  Good: "良好",
  Excellent: "优秀",
};

function HistoryCard({ item, onDelete, onUse }: {
  item: any;
  onDelete: (id: number) => void;
  onUse: (prompt: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const assessment = item.assessmentResult as any;
  const rating = assessment?.overallRating;
  const ratingColor = rating ? RATING_COLORS[rating] ?? "" : "";

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制！");
  };

  const exportMd = () => {
    const ratingZh = rating ? (RATING_ZH[rating] ?? rating) : "";
    const md = `# 提示词历史记录\n\n## 原始提示词\n\`\`\`\n${item.originalPrompt}\n\`\`\`\n\n${item.optimizedPrompt ? `## 优化后提示词\n\`\`\`\n${item.optimizedPrompt}\n\`\`\`\n\n` : ""}${assessment ? `## 评估结果\n- 评分：${assessment.overallScore}/4.0（${ratingZh}）\n- 摘要：${assessment.summary}\n` : ""}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `prompt-${item.id}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success("已导出！");
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-medium text-foreground truncate">
                {item.title ?? item.originalPrompt.slice(0, 60)}
              </h3>
              {rating && (
                <Badge variant="outline" className={`text-xs ${ratingColor}`}>{RATING_ZH[rating] ?? rating}</Badge>
              )}
              {item.optimizedPrompt && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> 已优化
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.createdAt).toLocaleDateString("zh-CN")}
              </span>
              {assessment && (
                <span className="flex items-center gap-1">
                  评分：<strong className="text-foreground">{assessment.overallScore}/4.0</strong>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-7 w-7 p-0">
              {expanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground">原始提示词</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => copyPrompt(item.originalPrompt)} className="h-6 text-xs gap-1">
                    <Copy className="w-3 h-3" /> 复制
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onUse(item.originalPrompt)} className="h-6 text-xs gap-1 text-primary">
                    使用 <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="bg-muted/40 rounded-lg p-3 font-mono text-xs text-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                {item.originalPrompt}
              </div>
            </div>

            {item.optimizedPrompt && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 优化后提示词
                  </p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => copyPrompt(item.optimizedPrompt)} className="h-6 text-xs gap-1">
                      <Copy className="w-3 h-3" /> 复制
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onUse(item.optimizedPrompt)} className="h-6 text-xs gap-1 text-primary">
                      使用 <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 font-mono text-xs text-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {item.optimizedPrompt}
                </div>
              </div>
            )}

            {assessment && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{assessment.summary}</p>
                <Button variant="outline" size="sm" onClick={exportMd} className="h-6 text-xs gap-1 shrink-0 ml-2">
                  <FileText className="w-3 h-3" /> 导出
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const { data: history, isLoading, refetch } = trpc.history.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteMutation = trpc.history.delete.useMutation({
    onSuccess: () => { toast.success("已删除"); refetch(); },
    onError: () => toast.error("删除失败"),
  });

  const filtered = history?.filter(item => {
    const q = search.toLowerCase();
    return !q || item.originalPrompt.toLowerCase().includes(q) ||
      (item.title ?? "").toLowerCase().includes(q) ||
      (item.optimizedPrompt ?? "").toLowerCase().includes(q);
  }) ?? [];

  const handleUse = (prompt: string) => {
    sessionStorage.setItem("promptcraft_load", prompt);
    navigate("/optimizer");
    toast.success("提示词已加载到优化器！");
  };

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">登录后查看历史记录</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            你的提示词历史记录保存在账户中。登录后即可访问已保存的提示词和优化记录。
          </p>
          <Button asChild className="gap-2">
            <a href={getLoginUrl()}><LogIn className="w-4 h-4" /> 登录</a>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* 页头 */}
        <div className="px-6 py-4 border-b border-border bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> 历史记录
              </h1>
              <p className="text-xs text-muted-foreground">你保存的提示词和优化记录</p>
            </div>
            <Badge variant="secondary">{filtered.length} 条记录</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索历史记录..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{search ? "未找到匹配的记录" : "暂无历史记录，开始优化提示词吧！"}</p>
              {!search && (
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => navigate("/optimizer")}>
                  <Sparkles className="w-3.5 h-3.5" /> 前往优化器
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-w-3xl mx-auto">
              {filtered.map(item => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  onDelete={(id) => deleteMutation.mutate({ id })}
                  onUse={handleUse}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
