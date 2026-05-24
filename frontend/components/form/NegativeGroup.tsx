"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useForm } from "@/lib/form-context";
import { vocab } from "@/lib/vocab";

export function NegativeGroup() {
  const { state, toggleMulti } = useForm();
  const selected = new Set(state.negativeGroups);
  const entries = Object.entries(vocab.negativePresets);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map(([groupId, preset]) => {
          const isOn = selected.has(groupId);
          return (
            <label
              key={groupId}
              className="flex items-start gap-3 rounded-lg border border-border/70 bg-card/60 p-3 cursor-pointer hover:border-primary/40 transition-colors"
            >
              <Switch
                checked={isOn}
                onCheckedChange={() => toggleMulti("negativeGroups", groupId)}
                className="mt-0.5"
              />
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <Label className="cn font-medium cursor-pointer">{preset.name_zh}</Label>
                  <span className="text-[11px] font-mono text-muted-foreground">{groupId}</span>
                </div>
                {preset.description_zh && (
                  <p className="text-[11px] text-muted-foreground cn">{preset.description_zh}</p>
                )}
                <p className="text-[10px] text-muted-foreground/70 font-mono line-clamp-1">
                  {preset.keywords_en.slice(0, 4).join(", ")}
                  {preset.keywords_en.length > 4 ? "…" : ""}
                </p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
