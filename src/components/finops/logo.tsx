"use client";

import { useId } from "react";

export function MonieLogo({
  className = "",
  size = 22,
}: {
  className?: string;
  size?: number;
}) {
  const maskId = useId();

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 64 56"
        style={{ height: size, width: (size * 64) / 56 }}
        aria-hidden="true"
      >
        <mask id={maskId}>
          <rect width="64" height="56" rx="20" fill="#fff" />
          <rect x="14" y="8" width="16" height="40" rx="8" fill="#000" />
          <rect x="34" y="8" width="16" height="40" rx="8" fill="#000" />
        </mask>
        <rect width="64" height="56" rx="20" fill="currentColor" mask={`url(#${maskId})`} />
      </svg>
      <span className="text-lg font-medium lowercase leading-none">monie</span>
    </span>
  );
}
