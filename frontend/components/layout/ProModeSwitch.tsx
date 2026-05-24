"use client";

import { Wrench } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useForm } from "@/lib/form-context";

export function ProModeSwitch() {
  const { proMode, setProMode, reset } = useForm();

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3">
      <label className="flex items-center gap-2.5 cursor-pointer min-w-0">
        <Switch
          checked={proMode}
          onCheckedChange={setProMode}
          id="pro-mode-switch"
        />
        <div className="flex flex-col gap-0.5 min-w-0">
          <Label htmlFor="pro-mode-switch" className="cn cursor-pointer flex items-center gap-1.5">
            <Wrench className="size-3.5 text-muted-foreground" />
            专业模式
          </Label>
          <span className="text-[11px] text-muted-foreground cn">
            打开后显示摄影 / 构图 / 设计师 / 画质 / 负向词 / 模板
          </span>
        </div>
      </label>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-border/70 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cn shrink-0"
      >
        重置
      </button>
    </div>
  );
}
