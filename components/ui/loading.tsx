import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Loading({ size = "md", text, fullScreen = false, className }: LoadingProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-primary-500", sizeClasses[size])} />
      {text && <p className="text-sm text-neutral-500 dark:text-neutral-400">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
}

export function PageLoading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loading size="lg" text="Carregando..." />
    </div>
  );
}
