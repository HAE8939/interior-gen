"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  id: string;
  name_zh: string;
  name_en: string;
}

interface SingleSelectDropdownProps {
  options: readonly Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export function SingleSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "选择…",
  className,
}: SingleSelectDropdownProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v != null) onChange(v);
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id} title={opt.name_en}>
            <span className="cn font-medium">{opt.name_zh}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
