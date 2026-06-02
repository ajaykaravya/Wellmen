"use client";

import { FaSpinner } from "react-icons/fa";

interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function Loading({ message = "Loading...", size = "md" }: LoadingProps) {

  const spinnerSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <FaSpinner className="animate-spin text-[color:var(--brand)]" size={spinnerSizes[size]} />
      <p className="text-sm theme-text-muted">{message}</p>
    </div>
  );
}
