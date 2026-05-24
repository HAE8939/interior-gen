"use client";

import { Check } from "lucide-react";
import Image from "next/image";

import type { LightingItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const timeLabel: Record<string, string> = {
  morning: "晨光",
  afternoon: "午后",
  dusk: "黄昏",
  night: "夜景",
};

interface LightingGridProps {
  options: readonly LightingItem[];
  value: string;
  onChange: (id: string) => void;
}

export function LightingGrid({ options, value, onChange }: LightingGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {options.map((opt) => {
        const selected = opt.id === value;
        const imgSrc = `/lighting-previews/${opt.id}.png`;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "group relative text-left rounded-xl border bg-card overflow-hidden transition-all",
              "hover:border-primary/40 hover:shadow-md",
              selected
                ? "border-primary border-[1.5px] shadow-sm ring-1 ring-primary/30"
                : "border-border/70",
            )}
          >
            {/* ── Preview image ── */}
            <div className="aspect-[4/3] w-full relative overflow-hidden bg-muted">
              <Image
                src={imgSrc}
                alt={opt.name_zh}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={false}
              />

              {/* Badges */}
              {opt.time_of_day && (
                <span className="absolute bottom-1.5 right-1.5 inline-flex items-center rounded bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[10px] text-white cn z-10">
                  {timeLabel[opt.time_of_day] ?? opt.time_of_day}
                </span>
              )}
              {selected && (
                <span className="absolute top-1.5 right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground z-10">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}

              {/* Subtle gradient overlay at bottom for text legibility */}
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* ── Label ── */}
            <div className="p-2 space-y-0.5">
              <div className="text-sm font-medium cn truncate">{opt.name_zh}</div>
              {opt.description_zh && (
                <div className="text-[10px] text-muted-foreground cn line-clamp-1">
                  {opt.description_zh}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
