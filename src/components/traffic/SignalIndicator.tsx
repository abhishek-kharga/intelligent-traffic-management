import { cn } from "@/lib/utils";

interface SignalIndicatorProps {
  state: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

const sizeMap = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-6 h-6",
};

export function SignalIndicator({ state, size = "md", pulse = true }: SignalIndicatorProps) {
  const colorClass =
    state === "green"
      ? "bg-signal-green"
      : state === "yellow"
      ? "bg-signal-yellow"
      : state === "red"
      ? "bg-signal-red"
      : "bg-signal-muted";

  return (
    <span className="relative inline-flex">
      <span className={cn("rounded-full", sizeMap[size], colorClass)} />
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-40",
            colorClass
          )}
        />
      )}
    </span>
  );
}
