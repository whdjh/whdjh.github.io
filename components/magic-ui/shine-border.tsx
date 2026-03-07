"use client";

import { cn } from "@/lib/utils";

interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  duration?: number;
  color?: string | string[];
}

export function ShineBorder({
  children,
  className,
  borderWidth = 1,
  duration = 14,
  color = ["#C29F74", "#7C4F2B", "#EAE4D3"],
}: ShineBorderProps) {
  const colorStr = Array.isArray(color) ? color.join(", ") : color;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg p-[1px]",
        className
      )}
      style={
        {
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          "--shine-color": colorStr,
          background: `linear-gradient(var(--angle, 0deg), ${colorStr})`,
          animation: `shine ${duration}s linear infinite`,
        } as React.CSSProperties
      }
    >
      <style>{`
        @keyframes shine {
          0% { --angle: 0deg; }
          100% { --angle: 360deg; }
        }
        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
      `}</style>
      <div className="relative z-10 rounded-[calc(0.5rem-1px)] bg-card">
        {children}
      </div>
    </div>
  );
}
