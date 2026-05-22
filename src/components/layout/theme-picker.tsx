"use client";

import { useTheme } from "@/lib/theme-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette } from "lucide-react";

export function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="px-3 pb-4">
      <div className="flex items-center gap-2 px-1 mb-1.5">
        <Palette className="h-4 w-4 shrink-0 theme-icon" />
        <span className="text-sm font-medium theme-label">Theme</span>
      </div>
      <Select value={theme} onValueChange={(v) => setTheme(v as typeof theme)}>
        <SelectTrigger className="h-8 text-xs theme-select-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {themes.map((t) => (
            <SelectItem key={t.value} value={t.value} className="text-xs">
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
