"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SkipToContent from "@/components/accessibility/SkipToContent";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isPaymentSuccess = pathname?.includes("/payment-success") || false;
  const isSuccessCheckout = pathname?.includes("/success-checkout") || false;
  const isErrorCheckout = pathname?.includes("/error-checkout") || false;
  const isMyschedule = pathname?.includes("/myschedule") || false;

  // Hide header and footer for payment/success/error pages to create full immersive experience
  const hideHeaderFooter = isPaymentSuccess || isSuccessCheckout || isErrorCheckout || isMyschedule;

  return (
    <>
      <SkipToContent />
      {!hideHeaderFooter && <Header />}
      <main
        id="main-content"
        className={`relative ${hideHeaderFooter ? 'min-h-screen' : 'min-h-screen'}`}
        role="main"
        tabIndex={-1}
      >
        {children}
      </main>
      {!hideHeaderFooter && <Footer />}
    </>
  );
}
