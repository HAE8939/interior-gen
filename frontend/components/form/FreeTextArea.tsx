"use client";

import { Textarea } from "@/components/ui/textarea";
import { useForm } from "@/lib/form-context";

export function FreeTextArea() {
  const { state, setField } = useForm();
  return (
    <div className="space-y-2">
      <Textarea
        value={state.freeText}
        onChange={(e) => setField("freeText", e.target.value)}
        placeholder="可用中文补充：阅读角、业主有橘猫、希望突出地板纹理等。后端 LLM 会翻译并融入合适位置。"
        rows={4}
        className="resize-none cn"
      />
      <p className="text-[11px] text-muted-foreground cn">
        当前字符数：{state.freeText.length}
      </p>
    </div>
  );
}
