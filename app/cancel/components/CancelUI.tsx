import React from "react";
import { CancelState } from "../hooks/useCancelPayment";

interface CancelUIProps {
  state: CancelState;
}

export const CancelUI: React.FC<CancelUIProps> = ({ state }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {state.status === "processing" && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-orange-500 mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Processing Cancellation
              </h2>
              <p className="text-gray-600">
                Please wait while we process your cancellation...
              </p>
            </div>
          )}

          {state.status === "success" && (
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-6">
                <svg
                  className="h-10 w-10 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Payment Cancelled
              </h2>

              {/* Message */}
              <p className="text-gray-600 mb-6">
                Your payment has been cancelled. No charges were made to your account.
              </p>

              {/* Info boxes */}
              <div className="space-y-3 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h3 className="text-sm font-semibold text-blue-800 mb-1">
                    ✓ Cart Cleared
                  </h3>
                  <p className="text-xs text-blue-700">
                    Your shopping cart has been cleared.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
                  <h3 className="text-sm font-semibold text-green-800 mb-1">
                    ✓ Slots Released
                  </h3>
                  <p className="text-xs text-green-700">
                    All reserved slots have been made available again.
                  </p>
                </div>
              </div>

              {/* What's next */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  What's next?
                </h3>
                <ul className="text-xs text-gray-600 space-y-1 text-left">
                  <li>• You can browse our services again</li>
                  <li>• Add items to your cart anytime</li>
                  <li>• Complete checkout when ready</li>
                </ul>
              </div>

              {/* Countdown */}
              {state.showCountdown && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Redirecting to home in{" "}
                    <span className="font-bold text-orange-600">
                      {state.countdown}
                    </span>{" "}
                    seconds...
                  </p>
                </div>
              )}
            </div>
          )}

          {state.status === "error" && (
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg
                  className="h-10 w-10 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Error Processing Cancellation
              </h2>

              {/* Error message */}
              <p className="text-gray-600 mb-6">
                {state.error || "An unexpected error occurred."}
              </p>

              {/* Contact info */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  Need Help?
                </h3>
                <p className="text-xs text-red-700 mb-2">
                  Please contact our support team:
                </p>
                <p className="text-sm font-bold text-red-800">
                  📞 (561) 330-7007
                </p>
              </div>

              {/* Return button */}
              <button
                onClick={() => window.location.href = "/"}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Return to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
