"use client";

import * as React from "react";
import { cn, getInitials } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-xl",
};

export function Avatar({ src, alt, name, size = "md", className }: AvatarProps) {
  const [error, setError] = React.useState(false);

  if (src && !error) {
    return (
      <div className={cn("relative rounded-full overflow-hidden bg-neutral-200", sizeClasses[size], className)}>
        <Image
          src={src}
          alt={alt || name || "Avatar"}
          fill
          className="object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-brand text-white font-medium",
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
