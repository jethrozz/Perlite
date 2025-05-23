import React from "react";
import { cn } from "@/lib/utils";

interface CyberpunkDividerProps {
  className?: string;
}

export function CyberpunkDivider({ className }: CyberpunkDividerProps) {
  return (
    <div className={cn("cyberpunk-divider", className)} />
  );
}
