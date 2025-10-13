"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Payment Cancel Page
 * This page is no longer used as Converge redirects directly to error-checkout
 * But kept as fallback in case of old configurations
 */
export default function PaymentCancel() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home as this page should not be accessed directly
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
} 