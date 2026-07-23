"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title }: { title: string }) {
  return (
    <div
      className="rounded-b-3xl px-4 pb-6 pt-6 text-white"
      style={{
        background: "linear-gradient(165deg, #00A3DA 0%, #00B2E2 55%, #2AC4EC 100%)",
      }}
    >
      <div className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center">
        <Link
          href="/finops"
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-md hover:bg-white/10"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="text-center text-lg font-medium">{title}</h1>
        <div />
      </div>
    </div>
  );
}
