"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "@/lib/form-context";
import { vocab } from "@/lib/vocab";

const NONE = "__none__";

const groupLabels: Record<keyof typeof vocab.artists, string> = {
  architects: "建筑师",
  interior_designers: "室内设计师",
  photographers: "摄影师",
  all: "全部",
};

export function ArtistSelect() {
  const { state, setField } = useForm();
  const value = state.artist ?? NONE;

  return (
    <Select
      value={value}
      onValueChange={(v) => setField("artist", v == null || v === NONE ? null : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder="不指定参考设计师" />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value={NONE}>
          <span className="cn text-muted-foreground">— 不指定 —</span>
        </SelectItem>
        {(["architects", "interior_designers", "photographers"] as const).map((g) => (
          <SelectGroup key={g}>
            <SelectLabel className="cn">{groupLabels[g]}</SelectLabel>
            {vocab.artists[g].map((opt) => (
              <SelectItem key={opt.id} value={opt.id} title={opt.name_en}>
                <span className="cn font-medium">{opt.name_zh}</span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
