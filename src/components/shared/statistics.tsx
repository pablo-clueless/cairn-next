"use client";

import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

type Trend = "down" | "neutral" | "up";

interface Props {
  icon: LucideIcon;
  title: string;
  value: string | number;
  className?: string;
  delta?: string;
  description?: string;
  trend?: Trend;
}

const variants: Record<Trend, string> = {
  down: "text-red-500",
  neutral: "text-amber-500",
  up: "text-green-500",
};

export const Statistics = ({
  icon: Icon,
  title,
  value,
  className,
  delta,
  description,
  trend,
}: Props) => {
  const variant = trend || "neutral";

  return (
    <div className={cn("space-y-4 rounded-xs border p-4", className)}>
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{title}</p>
        <Icon className="size-4" />
      </div>
      <p className="text-4xl font-semibold">{value}</p>
      <div className={cn("flex items-center gap-x-4", variants[variant])}>
        {trend &&
          (trend === "down" ? (
            <TrendingDown className="size-4" />
          ) : (
            <TrendingUp className="size-4" />
          ))}
        <div className="flex items-center gap-x-2">
          <p className="text-xs">{delta}</p>
          <p className="text-xs">{description}</p>
        </div>
      </div>
    </div>
  );
};
