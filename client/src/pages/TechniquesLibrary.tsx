import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Search, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { TECHNIQUES, type TechniqueCategory } from "../../../shared/promptData";
import AppLayout from "@/components/AppLayout";

const CATEGORY_CONFIG: Record<TechniqueCategory, { label: string; labelZh: string; color: string; bg: string }> = {
  reasoning: { label: "Reasoning", labelZh: "推理技巧", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800" },
  context: { label: "Context", labelZh: "上下文", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
  creative: { label: "Creative", labelZh: "创意表达", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  structural: { label: "Structural", labelZh: "结构设计", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
  output: { label: "Output", labelZh: "输出控制", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800" },
  advanced: { label: "Advanced", labelZh: "高级技巧", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" },
};

function TechniqueCard({ technique }: { technique: typeof TECHNIQUES[0] }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[technique.category];

  const copyExample = () => {
    navigator.clipboard.writeText(technique.example);
    toast.success("示例已复制！");
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
      <div
        className="flex items-start justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`text-xs font-mono font-bold ${cat.color} bg-muted px-1.5 py-0.5 rounded shrink-0`}>
            #{technique.id}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">{technique.nameZh}</h3>
              <span className="text-xs text-muted-foreground">{technique.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{technique.descriptionZh}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <Badge variant="outline" className={`text-xs ${cat.color} border-current hidden sm:flex`}>
            {cat.labelZh}
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <div className={`rounded-lg p-3 border ${cat.bg}`}>
            <p className="text-xs font-medium text-foreground mb-1">中文说明</p>
            <p className="text-xs text-muted-foreground">{technique.descriptionZh}</p>
            <p className="text-xs font-medium text-foreground mt-2 mb-1">English</p>
            <p className="text-xs text-muted-foreground">{technique.description}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-1">使用方法</p>
            <p className="text-xs text-muted-foreground">{technique.usageZh}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-foreground">使用示例</p>
              <Button variant="ghost" size="sm" onClick={copyExample} className="h-6 text-xs gap-1">
                <Copy className="w-3 h-3" /> 复制
              </Button>
            </div>
            <div className="bg-muted/50 rounded-md p-3 font-mono text-xs text-foreground leading-relaxed">
              {technique.example}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 italic">{technique.exampleZh}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-1">改善维度</p>
            <div className="flex flex-wrap gap-1">
              {technique.addressesDimensions.map(d => (
                <Badge key={d} variant="secondary" className="text-xs capitalize">{d}</Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TechniquesLibrary() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<TechniqueCategory | "all">("all");

  const filtered = useMemo(() => {
    return TECHNIQUES.filter(t => {
      const matchesCategory = activeCategory === "all" || t.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.nameZh.includes(q) ||
        t.description.toLowerCase().includes(q) || t.descriptionZh.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const categories = Object.entries(CATEGORY_CONFIG) as [TechniqueCategory, typeof CATEGORY_CONFIG[TechniqueCategory]][];

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* 页头 */}
        <div className="px-6 py-4 border-b border-border bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-foreground">技巧库</h1>
              <p className="text-xs text-muted-foreground">58个经过验证的提示词工程技巧，按类别整理</p>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">{filtered.length} / 58</Badge>
          </div>

          {/* 搜索 */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索技巧名称或描述..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* 分类过滤 */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveCategory("all")}
            >
              全部 (58)
            </Button>
            {categories.map(([cat, cfg]) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                className={`h-7 text-xs ${activeCategory === cat ? "" : cfg.color}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cfg.labelZh} ({TECHNIQUES.filter(t => t.category === cat).length})
              </Button>
            ))}
          </div>
        </div>

        {/* 技巧列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">未找到匹配的技巧</p>
            </div>
          ) : (
            <div className="space-y-2 max-w-3xl mx-auto">
              {activeCategory === "all" ? (
                categories.map(([cat, cfg]) => {
                  const catTechniques = filtered.filter(t => t.category === cat);
                  if (catTechniques.length === 0) return null;
                  return (
                    <div key={cat} className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className={`${cfg.color} border-current`}>
                          {cfg.labelZh} / {cfg.label}
                        </Badge>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">{catTechniques.length} 个技巧</span>
                      </div>
                      <div className="space-y-2">
                        {catTechniques.map(t => <TechniqueCard key={t.id} technique={t} />)}
                      </div>
                    </div>
                  );
                })
              ) : (
                filtered.map(t => <TechniqueCard key={t.id} technique={t} />)
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
