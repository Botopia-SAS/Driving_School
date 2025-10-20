"use client";

/**
 * Checkout Error Page
 * Shows error overlay with animation and explanatory message
 * Allows user to retry or return to cart page
 *
 * NEW: Also handles payment cancellations automatically
 *
 * Features:
 * - Professional animation to communicate the error
 * - Clear and explanatory message
 * - Possibility to retry the process
 * - Redirection to cart page when closing
 * - Automatic payment cancellation processing
 */

import { Suspense } from "react";
import ErrorCheckoutClient from "./components/ErrorCheckoutClient";

export default function ErrorCheckoutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <ErrorCheckoutClient />
      </Suspense>
    </div>
  );
}
