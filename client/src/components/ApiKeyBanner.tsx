import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings2, X, Sparkles, ExternalLink } from "lucide-react";
import { useModelConfig } from "@/contexts/ModelConfigContext";
import ModelConfigDialog from "./ModelConfigDialog";
import { PROVIDER_CONFIGS } from "../../../shared/modelProviders";

export default function ApiKeyBanner() {
  const { isConfigured, config } = useModelConfig();
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isConfigured || dismissed) return (
    <>
      <ModelConfigDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );

  return (
    <>
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-medium">配置 AI 模型 API Key</span>
              <span className="text-muted-foreground ml-1.5">才能使用评估和优化功能。推荐使用 DeepSeek（国内可直连，费用极低）。</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setDialogOpen(true)}
            >
              <Settings2 className="w-3.5 h-3.5" /> 立即配置
            </Button>
            <a
              href={PROVIDER_CONFIGS.deepseek.apiKeyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-0.5 hidden sm:flex"
            >
              获取 API Key <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      <ModelConfigDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

// Hook to open config dialog from anywhere
export function useModelConfigDialog() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
