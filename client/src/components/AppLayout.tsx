import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import {
  Sparkles, Wand2, BookOpen, Lightbulb, History, Home,
  Sun, Moon, LogIn, LogOut, User, Brain
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
    onError: () => toast.error(t('common.error')),
  });

  const NAV_ITEMS = [
    { path: "/optimizer", label: t('nav.optimizer'), icon: <Wand2 className="w-4 h-4" /> },
    { path: "/techniques", label: t('nav.techniques'), icon: <BookOpen className="w-4 h-4" /> },
    { path: "/learn", label: t('nav.learning'), icon: <Lightbulb className="w-4 h-4" /> },
    { path: "/history", label: t('nav.history'), icon: <History className="w-4 h-4" />, requiresAuth: true },
    { path: "/learning", label: t('nav.learning'), icon: <Brain className="w-4 h-4" />, requiresAuth: true },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-14 md:w-52 flex flex-col border-r border-border bg-sidebar shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 h-14 border-b border-sidebar-border">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-sidebar-foreground leading-none">PromptCraft</p>
            <p className="text-xs text-muted-foreground mt-0.5">AI {t('nav.optimizer')}</p>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          <Button
            variant={location === "/" ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start gap-2 text-xs h-9"
            onClick={() => navigate("/")}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="hidden md:block">{t('nav.home')}</span>
          </Button>
          {NAV_ITEMS.map((item) => {
            if (item.requiresAuth && !isAuthenticated) return null;
            const isActive = location === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={`w-full justify-start gap-2 text-xs h-9 ${isActive ? "text-primary font-medium" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="hidden md:block">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* 底部 */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {/* 语言切换按钮 */}
          <LanguageSwitcher />
          
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-9" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            <span className="hidden md:block">{theme === "dark" ? "Light" : "Dark"}</span>
          </Button>
          {isAuthenticated ? (
            <div className="hidden md:block">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 mb-1">
                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{user?.name ?? "User"}</span>
              </div>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-8 text-muted-foreground"
                onClick={() => logoutMutation.mutate()}>
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:block">{t('nav.logout')}</span>
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs h-9" asChild>
              <a href={getLoginUrl()}>
                <LogIn className="w-4 h-4 shrink-0" />
                <span className="hidden md:block">{t('nav.login')}</span>
              </a>
            </Button>
          )}
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}