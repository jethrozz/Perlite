import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  textClassName?: string;
  size?: "sm" | "md" | "lg";
  hideText?: boolean;
}

export function Logo({
  className,
  textClassName,
  size = "md",
  hideText = false,
}: LogoProps) {
  // Size mappings
  const sizeMap = {
    sm: {
      container: "h-8 w-8",
      inner: "h-6 w-6",
      text: "text-lg",
    },
    md: {
      container: "h-10 w-10",
      inner: "h-8 w-8",
      text: "text-2xl",
    },
    lg: {
      container: "h-12 w-12",
      inner: "h-10 w-10",
      text: "text-3xl",
    },
  };

  return (
    <div className="flex items-center space-x-2">
      <div
        className={cn(
          "bg-cyber-purple rounded-full flex items-center justify-center",
          sizeMap[size].container,
          className,
        )}
      >
        <div
          className={cn(
            "bg-cyber-dark rounded-full flex items-center justify-center",
            sizeMap[size].inner,
          )}
        >
          <span className="font-rajdhani font-bold text-cyber-purple">Per</span>
        </div>
      </div>

      {!hideText && (
        <h1
          className={cn(
            "font-rajdhani font-bold bg-gradient-to-r from-cyber-purple to-cyber-magenta bg-clip-text text-transparent",
            sizeMap[size].text,
            textClassName,
          )}
        >
          Per<span className="text-cyber-cyan">lite</span>
        </h1>
      )}
    </div>
  );
}
