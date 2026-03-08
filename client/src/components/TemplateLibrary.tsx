import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Copy, ArrowRight, X, Layers } from "lucide-react";
import { PROMPT_TEMPLATES } from "../../../shared/promptData";

interface TemplateLibraryProps {
  onApply: (template: string) => void;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  "UI/UX Design": "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800",
  "Code Generation": "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  "Content Creation": "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
  "Data Analysis": "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  "Product Management": "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800",
};

const CATEGORY_ZH: Record<string, string> = {
  "UI/UX Design": "UI/UX设计",
  "Code Generation": "代码生成",
  "Content Creation": "内容创作",
  "Data Analysis": "数据分析",
  "Product Management": "产品管理",
};

export default function TemplateLibrary({ onApply, onClose }: TemplateLibraryProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [preview, setPreview] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(PROMPT_TEMPLATES.map(t => t.category)));
    return cats;
  }, []);

  const filtered = useMemo(() => {
    return PROMPT_TEMPLATES.filter(t => {
      const matchesCat = activeCategory === "all" || t.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch = !q || t.title.toLowerCase().includes(q) || t.titleZh.includes(q) ||
        t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q));
      return matchesCat && matchesSearch;
    });
  }, [search, activeCategory]);

  const handleApply = (template: string, title: string) => {
    onApply(template);
    toast.success(`已应用模板「${title}」！`);
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">模板库</h2>
          <Badge variant="secondary" className="text-xs">{PROMPT_TEMPLATES.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* 搜索 */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索模板..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* 分类过滤 */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border">
        <Button
          variant={activeCategory === "all" ? "default" : "ghost"}
          size="sm"
          className="h-6 text-xs px-2"
          onClick={() => setActiveCategory("all")}
        >
          全部
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "ghost"}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_ZH[cat] ?? cat.split("/")[0].trim()}
          </Button>
        ))}
      </div>

      {/* 模板列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">未找到匹配的模板</div>
        ) : (
          filtered.map(t => {
            const catColor = CATEGORY_COLORS[t.category] ?? "text-muted-foreground bg-muted border-border";
            const isPreviewOpen = preview === t.id;
            return (
              <div key={t.id} className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{t.titleZh}</p>
                      <p className="text-xs text-muted-foreground">{t.title}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${catColor}`}>
                      {CATEGORY_ZH[t.category] ?? t.category.split("/")[0].trim()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{t.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {t.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1 flex-1"
                      onClick={() => setPreview(isPreviewOpen ? null : t.id)}
                    >
                      {isPreviewOpen ? "收起" : "预览"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1"
                      onClick={() => { navigator.clipboard.writeText(t.template); toast.success("已复制！"); }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 text-xs gap-1 flex-1"
                      onClick={() => handleApply(t.template, t.titleZh)}
                    >
                      使用 <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {isPreviewOpen && (
                  <div className="border-t border-border bg-muted/30 p-3">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto font-mono">
                      {t.template}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
