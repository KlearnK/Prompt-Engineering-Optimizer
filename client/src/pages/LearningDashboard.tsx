import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Brain, TrendingUp, Star, BookOpen, Plus, Trash2, Edit,
  BarChart2, Zap, Target, Award, ChevronUp, ChevronDown, Minus
} from "lucide-react";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { TECHNIQUES, QUALITY_DIMENSIONS } from "@shared/promptData";
import { getLoginUrl } from "@/const";

const DIMENSION_LABELS: Record<string, string> = {
  clarity: "清晰度",
  specificity: "特异性",
  structure: "结构性",
  completeness: "完整性",
  tone: "语气",
  constraints: "约束性",
};

export default function LearningDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<{ id: number; title: string; content: string } | null>(null);
  const [newRule, setNewRule] = useState({ title: "", content: "", entryType: "custom_rule" as const, category: "" });

  const { data: dashboard, isLoading, refetch } = trpc.learning.dashboard.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const recordEvent = trpc.learning.recordEvent.useMutation();
  const toggleFavorite = trpc.learning.toggleFavorite.useMutation({
    onSuccess: () => refetch(),
  });
  const addKnowledge = trpc.learning.knowledge.add.useMutation({
    onSuccess: () => { refetch(); setNewRuleOpen(false); setNewRule({ title: "", content: "", entryType: "custom_rule", category: "" }); toast.success("规则已添加"); },
  });
  const updateKnowledge = trpc.learning.knowledge.update.useMutation({
    onSuccess: () => { refetch(); setEditingRule(null); toast.success("规则已更新"); },
  });
  const deleteKnowledge = trpc.learning.knowledge.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("规则已删除"); },
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Brain className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">登录后查看学习进度</h2>
        <p className="text-muted-foreground text-center max-w-md">
          系统会持续记录你的使用行为，自动调整评估权重，帮助你越用越顺手。
        </p>
        <Button onClick={() => window.location.href = getLoginUrl()}>立即登录</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Brain className="w-10 h-10 text-primary animate-pulse" />
          <p className="text-muted-foreground">加载学习数据中...</p>
        </div>
      </div>
    );
  }

  const stats = dashboard?.behaviorStats;
  const weights = dashboard?.dimensionWeights ?? {};
  const topTechniques = dashboard?.topTechniques ?? [];
  const favoriteTechniques = new Set(dashboard?.favoriteTechniques ?? []);
  const knowledgeEntries = dashboard?.knowledgeEntries ?? [];
  const scoresOverTime = dashboard?.scoresOverTime ?? [];

  // Prepare radar chart data for dimension weights
  const radarData = Object.entries(DIMENSION_LABELS).map(([key, label]) => ({
    dimension: label,
    weight: Math.round((weights[key] ?? 1.0) * 100),
    fullMark: 200,
  }));

  // Prepare score trend data
  const trendData = scoresOverTime.slice(-10).map((item, i) => ({
    name: `#${i + 1}`,
    score: item.score,
    title: item.title,
  }));

  const getTechniqueById = (id: string) => TECHNIQUES.find(t => t.id === Number(id));

  const getWeightIcon = (weight: number) => {
    if (weight > 1.2) return <ChevronUp className="w-3 h-3 text-green-500" />;
    if (weight < 0.8) return <ChevronDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const getWeightColor = (weight: number) => {
    if (weight > 1.3) return "text-green-600 bg-green-50";
    if (weight > 1.1) return "text-green-500 bg-green-50/50";
    if (weight < 0.7) return "text-red-500 bg-red-50";
    if (weight < 0.9) return "text-orange-500 bg-orange-50/50";
    return "text-muted-foreground bg-muted/30";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-primary" />
            学习仪表板
          </h1>
          <p className="text-muted-foreground mt-1">系统正在从你的使用行为中持续学习，自动优化评估策略</p>
        </div>
        <Badge variant="outline" className="text-xs gap-1">
          <Zap className="w-3 h-3" />
          持续学习中
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "总交互次数", value: stats?.totalEvents ?? 0, icon: BarChart2, color: "text-blue-500" },
          { label: "采纳技巧次数", value: stats?.techniqueAdoptions ?? 0, icon: Target, color: "text-green-500" },
          { label: "优化被接受", value: stats?.optimizationsAccepted ?? 0, icon: Award, color: "text-purple-500" },
          { label: "平均改进分数", value: `+${((stats?.avgScoreDelta ?? 0) * 100).toFixed(1)}`, icon: TrendingUp, color: "text-orange-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-0 shadow-sm bg-card/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <Icon className={`w-5 h-5 ${color} mt-1`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="weights">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="weights">维度权重</TabsTrigger>
          <TabsTrigger value="techniques">技巧偏好</TabsTrigger>
          <TabsTrigger value="progress">进步曲线</TabsTrigger>
          <TabsTrigger value="knowledge">个人规则库</TabsTrigger>
        </TabsList>

        {/* Dimension Weights Tab */}
        <TabsContent value="weights" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">个性化评估权重</CardTitle>
                <p className="text-xs text-muted-foreground">基于你的反馈自动调整，影响评估结果的侧重点</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
                  const weight = weights[key] ?? 1.0;
                  const pct = Math.round(weight * 100);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm w-16 text-muted-foreground">{label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${weight > 1.1 ? 'bg-green-500' : weight < 0.9 ? 'bg-orange-400' : 'bg-primary/60'}`}
                          style={{ width: `${Math.min(100, pct / 2)}%` }}
                        />
                      </div>
                      <div className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${getWeightColor(weight)}`}>
                        {getWeightIcon(weight)}
                        <span>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  权重会随着你的使用自动调整。当你对某个维度给出正面/负面反馈时，对应权重会小幅变化。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">权重雷达图</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                    <Radar name="权重" dataKey="weight" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Techniques Tab */}
        <TabsContent value="techniques" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">最常采纳的技巧</CardTitle>
                <p className="text-xs text-muted-foreground">你最喜欢使用的优化技巧</p>
              </CardHeader>
              <CardContent>
                {topTechniques.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>还没有采纳记录</p>
                    <p className="text-xs mt-1">在优化器中采纳技巧建议后，这里会显示统计</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topTechniques.map((stat, i) => {
                      const technique = getTechniqueById(stat.techniqueId);
                      if (!technique) return null;
                      return (
                        <div key={stat.techniqueId} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{technique.name}</p>
                            <p className="text-xs text-muted-foreground">采纳 {stat.timesAdopted} 次</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => toggleFavorite.mutate({ techniqueId: stat.techniqueId, isFavorited: !favoriteTechniques.has(stat.techniqueId) })}
                          >
                            <Star className={`w-4 h-4 ${favoriteTechniques.has(stat.techniqueId) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  收藏的技巧
                </CardTitle>
                <p className="text-xs text-muted-foreground">优化时会优先推荐这些技巧</p>
              </CardHeader>
              <CardContent>
                {favoriteTechniques.size === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>还没有收藏的技巧</p>
                    <p className="text-xs mt-1">点击技巧旁的星标即可收藏</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Array.from(favoriteTechniques).map(id => {
                      const technique = getTechniqueById(id);
                      if (!technique) return null;
                      return (
                        <Badge key={id} variant="secondary" className="gap-1 cursor-pointer hover:bg-destructive/10"
                          onClick={() => toggleFavorite.mutate({ techniqueId: id, isFavorited: false })}>
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {technique.name}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                提示词质量进步曲线
              </CardTitle>
              <p className="text-xs text-muted-foreground">最近 10 条有评估结果的提示词综合评分趋势</p>
            </CardHeader>
            <CardContent>
              {trendData.length < 2 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>至少需要 2 条评估记录才能显示趋势</p>
                  <p className="text-xs mt-1">在优化器中评估并保存提示词后，这里会显示进步曲线</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value} 分`, "综合评分"]}
                      labelFormatter={(label) => {
                        const item = trendData.find(d => d.name === label);
                        return item?.title ?? label;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    个人规则库
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    这些规则会注入到 AI 评估和优化的系统提示中，让 AI 了解你的个人偏好
                  </p>
                </div>
                <Dialog open={newRuleOpen} onOpenChange={setNewRuleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      添加规则
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加个人规则</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div>
                        <Label>规则类型</Label>
                        <Select value={newRule.entryType} onValueChange={(v) => setNewRule(r => ({ ...r, entryType: v as typeof r.entryType }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom_rule">自定义规则</SelectItem>
                            <SelectItem value="personal_note">个人笔记</SelectItem>
                            <SelectItem value="learned_pattern">学习到的模式</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>标题</Label>
                        <Input
                          className="mt-1"
                          placeholder="如：总是要求 JSON 格式输出"
                          value={newRule.title}
                          onChange={e => setNewRule(r => ({ ...r, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>内容</Label>
                        <Textarea
                          className="mt-1"
                          rows={4}
                          placeholder="描述这条规则的具体内容，AI 会在评估和优化时参考它..."
                          value={newRule.content}
                          onChange={e => setNewRule(r => ({ ...r, content: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>适用场景（可选）</Label>
                        <Input
                          className="mt-1"
                          placeholder="如：代码生成、UI设计..."
                          value={newRule.category}
                          onChange={e => setNewRule(r => ({ ...r, category: e.target.value }))}
                        />
                      </div>
                      <Button
                        className="w-full"
                        disabled={!newRule.title || !newRule.content || addKnowledge.isPending}
                        onClick={() => addKnowledge.mutate(newRule)}
                      >
                        {addKnowledge.isPending ? "添加中..." : "添加规则"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {knowledgeEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>还没有个人规则</p>
                  <p className="text-xs mt-1">添加你的写作偏好、常用格式要求等，AI 会在评估时参考这些规则</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {knowledgeEntries.map(entry => (
                    <div key={entry.id} className="border rounded-lg p-3 space-y-1 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{entry.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {entry.entryType === 'custom_rule' ? '自定义规则' :
                               entry.entryType === 'personal_note' ? '个人笔记' : '学习模式'}
                            </Badge>
                            {entry.category && (
                              <Badge variant="secondary" className="text-xs">{entry.category}</Badge>
                            )}
                          </div>
                          {editingRule?.id === entry.id ? (
                            <div className="mt-2 space-y-2">
                              <Input
                                value={editingRule?.title ?? ''}
                                onChange={e => setEditingRule(r => r ? { ...r, title: e.target.value } : null)}
                              />
                              <Textarea
                                rows={3}
                                value={editingRule?.content ?? ''}
                                onChange={e => setEditingRule(r => r ? { ...r, content: e.target.value } : null)}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => editingRule && updateKnowledge.mutate({ id: entry.id, title: editingRule.title, content: editingRule.content })}>保存</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingRule(null)}>取消</Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.content}</p>
                          )}
                        </div>
                        {editingRule?.id !== entry.id && (
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => setEditingRule({ id: entry.id, title: entry.title, content: entry.content })}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive"
                              onClick={() => deleteKnowledge.mutate({ id: entry.id })}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
