"use client";
import React, { Suspense } from "react";
import { CancelContent } from "./components/CancelContent";
import { CancelFallback } from "./components/CancelFallback";

export default function CancelPage() {
  return (
    <Suspense fallback={<CancelFallback />}>
      <CancelContent />
    </Suspense>
  );
}
