import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  BookOpen, ChevronRight, ChevronLeft, CheckCircle2,
  Lightbulb, Code2, ArrowRight, Trophy, RotateCcw
} from "lucide-react";
import { LEARNING_LESSONS } from "../../../shared/promptData";
import AppLayout from "@/components/AppLayout";

export default function LearningModule() {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [showExercise, setShowExercise] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [showSolution, setShowSolution] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());

  const lesson = LEARNING_LESSONS[currentLesson];
  const progress = (completedLessons.size / LEARNING_LESSONS.length) * 100;

  const handleComplete = () => {
    setCompletedLessons(prev => new Set(Array.from(prev).concat(currentLesson)));
    toast.success("课程完成！🎉");
    if (currentLesson < LEARNING_LESSONS.length - 1) {
      setTimeout(() => {
        setCurrentLesson(prev => prev + 1);
        setShowExercise(false);
        setUserAnswer("");
        setShowSolution(false);
      }, 800);
    }
  };

  const handleReset = () => {
    setUserAnswer("");
    setShowSolution(false);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* 页头 */}
        <div className="px-6 py-4 border-b border-border bg-card/50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                学习模块
              </h1>
              <p className="text-xs text-muted-foreground">通过互动课程掌握提示词工程技巧</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">学习进度</p>
                <p className="text-sm font-semibold text-foreground">{completedLessons.size} / {LEARNING_LESSONS.length}</p>
              </div>
              <div className="w-24">
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>

          {/* 课程导航 */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {LEARNING_LESSONS.map((l, i) => (
              <button
                key={l.id}
                onClick={() => { setCurrentLesson(i); setShowExercise(false); setUserAnswer(""); setShowSolution(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  i === currentLesson
                    ? "bg-primary text-primary-foreground border-primary"
                    : completedLessons.has(i)
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {completedLessons.has(i) && <CheckCircle2 className="w-3 h-3" />}
                第 {i + 1} 课
              </button>
            ))}
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* 课程标题 */}
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="outline" className="text-xs mb-2">第 {currentLesson + 1} 课，共 {LEARNING_LESSONS.length} 课</Badge>
                <h2 className="text-xl font-bold text-foreground">{lesson.titleZh}</h2>
                <p className="text-sm text-muted-foreground">{lesson.title}</p>
              </div>
              {completedLessons.has(currentLesson) && (
                <Badge className="bg-emerald-500 text-white gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 已完成
                </Badge>
              )}
            </div>

            {/* 课程内容 */}
            {!showExercise ? (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="prose prose-sm max-w-none text-foreground">
                    {lesson.contentZh.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <h3 key={i} className="text-sm font-semibold text-foreground mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
                      }
                      if (line.startsWith('- ')) {
                        return <p key={i} className="text-sm text-muted-foreground flex gap-2 mb-1"><span className="text-primary mt-1">•</span><span>{line.slice(2)}</span></p>;
                      }
                      if (line.trim() === '') return <div key={i} className="h-2" />;
                      return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>;
                    })}
                  </div>
                </div>

                {/* 英文版本（可展开） */}
                <details className="group">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 select-none">
                    <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                    查看英文版本
                  </summary>
                  <div className="mt-2 bg-muted/30 border border-border rounded-lg p-4">
                    {lesson.content.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <h3 key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">{line.replace(/\*\*/g, '')}</h3>;
                      }
                      if (line.startsWith('- ')) {
                        return <p key={i} className="text-sm text-muted-foreground flex gap-2 mb-1"><span className="text-primary">•</span><span>{line.slice(2)}</span></p>;
                      }
                      if (line.trim() === '') return <div key={i} className="h-1.5" />;
                      return <p key={i} className="text-sm text-muted-foreground">{line}</p>;
                    })}
                  </div>
                </details>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { if (currentLesson > 0) { setCurrentLesson(prev => prev - 1); setShowExercise(false); setUserAnswer(""); setShowSolution(false); } }}
                    disabled={currentLesson === 0}
                    className="gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" /> 上一课
                  </Button>
                  <Button size="sm" onClick={() => setShowExercise(true)} className="gap-1.5">
                    开始练习 <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* 练习区 */
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">练习题</p>
                      <p className="text-sm text-muted-foreground">{lesson.exercise.promptZh}</p>
                      <p className="text-xs text-muted-foreground mt-1 italic">{lesson.exercise.prompt}</p>
                    </div>
                  </div>
                </div>

                {/* 反面示例 */}
                <div>
                  <p className="text-xs font-medium text-red-500 mb-1.5 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 text-xs">✗</span>
                    糟糕的示例（优化前）
                  </p>
                  <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 font-mono text-xs text-muted-foreground">
                    {lesson.exercise.badExample}
                  </div>
                </div>

                {/* 提示 */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">提示</p>
                  <p className="text-xs text-muted-foreground">{lesson.exercise.hintZh}</p>
                </div>

                {/* 用户答案 */}
                <div>
                  <p className="text-xs font-medium text-foreground mb-1.5">你的改进版本</p>
                  <Textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="在此写下你改进后的提示词..."
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>

                {/* 参考答案 */}
                {showSolution && (
                  <div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 参考答案
                    </p>
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                      {lesson.exercise.goodExample}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowExercise(false)} className="gap-1.5">
                      <ChevronLeft className="w-4 h-4" /> 返回课程
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" /> 重置
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {!showSolution && (
                      <Button variant="outline" size="sm" onClick={() => setShowSolution(true)} className="gap-1.5">
                        <Code2 className="w-3.5 h-3.5" /> 查看答案
                      </Button>
                    )}
                    <Button size="sm" onClick={handleComplete} className="gap-1.5">
                      <Trophy className="w-3.5 h-3.5" /> 标记完成
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
