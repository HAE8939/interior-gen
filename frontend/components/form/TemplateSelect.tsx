"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "@/lib/form-context";
import { vocab } from "@/lib/vocab";

export function TemplateSelect() {
  const { state, setField } = useForm();
  return (
    <div className="space-y-2">
      <Select
        value={state.template}
        onValueChange={(v) => {
          if (v != null) setField("template", v);
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {vocab.templates.map((t) => (
            <SelectItem key={t.id} value={t.id} title={t.id}>
              <span className="cn font-medium">{t.name_zh}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(() => {
        const t = vocab.templates.find((x) => x.id === state.template);
        if (!t?.description_zh) return null;
        return (
          <p className="text-[11px] text-muted-foreground cn leading-relaxed">
            {t.description_zh}
          </p>
        );
      })()}
    </div>
  );
}
