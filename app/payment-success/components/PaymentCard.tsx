import React from "react";
import { PaymentSuccessState } from "../hooks/usePaymentSuccess";

interface PaymentCardProps {
  state: PaymentSuccessState;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ state }) => {
  const getStatusIcon = () => {
    switch (state.transactionStatus) {
      case "approved":
        return (
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-emerald-400/40 rounded-full blur-2xl scale-125 animate-pulse"></div>
          </div>
        );
      case "processing":
        return (
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl">
              <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-blue-400/40 rounded-full blur-2xl scale-125 animate-pulse"></div>
          </div>
        );
      case "pending":
        return (
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl">
              <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-2xl scale-125 animate-pulse"></div>
          </div>
        );
      case "error":
        return (
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="absolute inset-0 bg-red-400/40 rounded-full blur-2xl scale-125 animate-pulse"></div>
          </div>
        );
      default:
        return (
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl border-4 border-blue-200">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
            <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl scale-125 animate-pulse"></div>
          </div>
        );
    }
  };

  const getStatusMessage = () => {
    switch (state.transactionStatus) {
      case "approved":
        return {
          title: "Payment Successful",
          subtitle: "Transaction confirmed",
          description: "Your order has been processed and you will receive a confirmation email shortly.",
          statusClass: "text-emerald-600",
          bgClass: "bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200",
          countdownClass: "text-emerald-700",
          buttonClass: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
        };
      case "processing":
        return {
          title: "Completing Order",
          subtitle: "Finalizing your purchase",
          description: "Payment approved! We are completing your order and updating your lesson slots.",
          statusClass: "text-blue-600",
          bgClass: "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200",
          countdownClass: "text-blue-700",
          buttonClass: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        };
      case "pending":
        return {
          title: "Processing Payment",
          subtitle: "Verifying transaction",
          description: "We are confirming your payment. This may take a few moments.",
          statusClass: "text-amber-600",
          bgClass: "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200",
          countdownClass: "text-amber-700",
          buttonClass: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
        };
      case "error":
        return {
          title: "Verification Failed",
          subtitle: "Unable to confirm payment",
          description: "Please contact our support team if you have any questions.",
          statusClass: "text-red-600",
          bgClass: "bg-gradient-to-r from-red-50 to-red-100 border-red-200",
          countdownClass: "text-red-700",
          buttonClass: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
        };
      default:
        return {
          title: "Verifying Payment",
          subtitle: "Processing your information",
          description: "Please wait while we verify your transaction details.",
          statusClass: "text-blue-600",
          bgClass: "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200",
          countdownClass: "text-blue-700",
          buttonClass: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="relative perspective-1000">
      <div className={`relative transition-transform duration-1000 transform-style-preserve-3d h-[36rem] ${state.isCardFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front of Card - Loading/Checking */}
        <div className={`absolute inset-0 backface-hidden ${state.isCardFlipped ? 'invisible' : 'visible'}`}>
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/30 via-blue-500/30 to-blue-600/30 rounded-3xl blur-xl opacity-75 animate-pulse"></div>
            
            {/* Card Front */}
            <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl p-12 border border-white/20 h-full flex flex-col justify-center">
              <div className="text-center">
                {/* Checking Icon - White background with blue spinner */}
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl border-4 border-blue-200">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  </div>
                  <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl scale-125 animate-pulse"></div>
                </div>
                
                <h1 className="text-4xl font-black mb-6 text-blue-600 tracking-tight">
                  Verifying Payment
                </h1>
                
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200/50">
                  <p className="text-xl text-gray-800 mb-2 font-semibold">
                    Processing transaction...
                  </p>
                  
                  <p className="text-base text-gray-600">
                    Please wait while we verify your payment status.
                  </p>
                </div>

                {/* Loading Animation */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-xl p-4 shadow-inner">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <p className="text-sm font-bold text-blue-700">
                      {state.isProcessingSlots ? 'Updating lesson slots...' : 'Checking payment status...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back of Card - Result */}
        <div className={`backface-hidden rotate-y-180 ${state.isCardFlipped ? 'visible' : 'invisible'}`}>
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/30 via-blue-500/30 to-blue-600/30 rounded-3xl blur-xl opacity-75 animate-pulse"></div>
            
            {/* Card Back */}
            <div className="relative bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl p-12 border border-white/20 h-full flex flex-col justify-center">
              <div className="text-center">
                {/* Floating Status Icon */}
                <div className="relative mb-6">
                  {getStatusIcon()}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-500/20 rounded-full blur-xl scale-150 -z-10 animate-pulse"></div>
                </div>
                
                <h1 className={`text-4xl font-black mb-6 ${statusInfo.statusClass} tracking-tight`}>
                  {statusInfo.title}
                </h1>
                
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200/50">
                  <p className="text-xl text-gray-800 mb-2 font-semibold">
                    {statusInfo.subtitle}
                  </p>
                  
                  <p className="text-base text-gray-600">
                    {statusInfo.description}
                  </p>
                </div>

                {state.orderDetails && state.transactionStatus === "approved" && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-2">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-bold text-emerald-800">Order Confirmed</h3>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        COMPLETED
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/70 rounded-lg p-3 border border-emerald-200/50">
                        <div className="text-xs text-gray-600 font-medium mb-1">Order #</div>
                        <div className="font-mono text-sm text-emerald-700 font-bold">{state.orderDetails.orderNumber}</div>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 border border-emerald-200/50">
                        <div className="text-xs text-gray-600 font-medium mb-1">Amount</div>
                        <div className="text-lg font-bold text-emerald-600">${state.orderDetails.total}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Countdown Timer */}
                {state.showCountdown && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4 shadow-sm animate-fade-in">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center animate-spin">
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-blue-700">
                        Redirecting in <span className="text-sm text-blue-800 font-bold">{state.countdown}</span> seconds
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
