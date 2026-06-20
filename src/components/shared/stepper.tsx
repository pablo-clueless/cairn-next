import { type LucideIcon, Home } from "lucide-react";

import { cn } from "@/lib/utils";

type StepProps = {
  index: number;
  label: string;
  description?: string;
  icon?: LucideIcon;
};

interface StepperProps {
  current: number;
  steps: StepProps[];
  className?: string;
  onStepChange?: (step: number) => void;
  stepperClassName?: string;
}

export function Stepper({
  current,
  steps,
  className,
  onStepChange,
  stepperClassName,
}: StepperProps) {
  return (
    <div className={cn("relative flex w-full items-center justify-center gap-x-0.5", className)}>
      {steps.map(({ index, label, description, icon: Icon }) => (
        <div
          key={index}
          onClick={() => onStepChange?.(index)}
          role="button"
          className={cn(
            "flex flex-1 flex-col gap-y-0.5 p-2",
            current === index && "bg-primary-50/50 text-primary-600",
            current < index && "bg-neutral-200 text-neutral-600",
            current > index && "bg-green-100 text-green-600",
            onStepChange ? "cursor-pointer" : "cursor-default",
            stepperClassName,
          )}
        >
          <div className="flex items-center gap-x-2">
            <Home />
            <div className="flex items-center gap-x-2">
              {Icon && <Icon className="size-4" />}
              <span className="text-sm font-medium">{label}</span>
            </div>
          </div>
          <span className="text-xs">{description}</span>
        </div>
      ))}
    </div>
  );
}
