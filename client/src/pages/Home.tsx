import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Sparkles, Zap, BookOpen, ArrowRight, Target, LayoutList, Shield, Eye, MessageSquare, CheckSquare, Wand2, Lightbulb } from "lucide-react";
import { getLoginUrl } from "@/const";

const features = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "AI 驱动优化",
    description: "基于6维质量评估，一键智能重写，让提示词更精准、更有效",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "6维质量评估",
    description: "从清晰度、特异性、结构性、完整性、语气、约束性六个维度全面评估",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "58个技巧库",
    description: "按类别整理的全面提示词工程技巧，覆盖推理、上下文、创意、结构等方向",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "场景模板库",
    description: "UI/UX设计、代码生成、内容创作等场景的即用模板，快速上手",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    icon: <Lightbulb className="w-5 h-5" />,
    title: "互动学习模块",
    description: "通过示例和练习系统学习提示词编写技巧，从入门到进阶",
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/30",
  },
  {
    icon: <Wand2 className="w-5 h-5" />,
    title: "UI关键词转换",
    description: "将模糊的UI描述词转换为专业的设计术语，提升设计类提示词质量",
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
];

const dimensions = [
  { icon: <Eye className="w-4 h-4" />, name: "清晰度", sub: "Clarity", color: "text-blue-500" },
  { icon: <Target className="w-4 h-4" />, name: "特异性", sub: "Specificity", color: "text-violet-500" },
  { icon: <LayoutList className="w-4 h-4" />, name: "结构性", sub: "Structure", color: "text-emerald-500" },
  { icon: <CheckSquare className="w-4 h-4" />, name: "完整性", sub: "Completeness", color: "text-amber-500" },
  { icon: <MessageSquare className="w-4 h-4" />, name: "语气", sub: "Tone", color: "text-pink-500" },
  { icon: <Shield className="w-4 h-4" />, name: "约束性", sub: "Constraints", color: "text-orange-500" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">PromptCraft</span>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => navigate("/optimizer")}>优化器</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/techniques")}>技巧库</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/learn")}>学习</Button>
            {isAuthenticated && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>历史</Button>
            )}
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button size="sm" onClick={() => navigate("/optimizer")}>
                打开优化器 <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <a href={getLoginUrl()}>登录</a>
                </Button>
                <Button size="sm" onClick={() => navigate("/optimizer")}>
                  免费试用 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
            <Sparkles className="w-3 h-3 mr-1" /> 由先进 AI 驱动
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            写出更好的提示词，<br />
            <span className="text-primary">获得更好的结果</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            PromptCraft 从6个质量维度分析你的提示词，运用58种经过验证的优化技巧，一键生成改进版本。
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button size="lg" onClick={() => navigate("/optimizer")} className="gap-2">
              <Sparkles className="w-4 h-4" />
              开始优化
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/learn")} className="gap-2">
              <BookOpen className="w-4 h-4" />
              学习技巧
            </Button>
          </div>
        </div>
      </section>

      {/* 6维评估 */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <p className="text-center text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">
            6 个质量维度全面评估
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {dimensions.map((d) => (
              <div key={d.name} className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-sm">
                <span className={d.color}>{d.icon}</span>
                <span className="text-sm font-medium text-foreground">{d.name}</span>
                <span className="text-xs text-muted-foreground">/ {d.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">一切你需要的功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-3 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使用流程 */}
      <section className="py-16 bg-muted/20">
        <div className="container">
          <h2 className="text-2xl font-bold text-center text-foreground mb-10">三步完成优化</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: "01", title: "输入提示词", desc: "在编辑器中输入你想要优化的提示词，或从模板库中选择一个起点" },
              { step: "02", title: "评估质量", desc: "点击「评估质量」，AI 将从6个维度分析你的提示词，给出详细评分和改进建议" },
              { step: "03", title: "一键优化", desc: "点击「一键优化」，AI 自动生成改进版本，对比原版与优化版，选择最佳结果" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5 border-t border-primary/10">
        <div className="container text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">准备好写出更好的提示词了吗？</h2>
          <p className="text-muted-foreground mb-6">无需注册即可开始使用。登录后可保存历史记录。</p>
          <Button size="lg" onClick={() => navigate("/optimizer")} className="gap-2">
            <Zap className="w-4 h-4" />
            打开提示词优化器
          </Button>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-border py-6">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>PromptCraft — 基于 stitch-skills 最佳实践构建</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate("/techniques")} className="hover:text-foreground transition-colors">58个技巧</button>
            <button onClick={() => navigate("/learn")} className="hover:text-foreground transition-colors">学习</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
