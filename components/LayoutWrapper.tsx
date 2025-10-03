"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isPaymentSuccess = pathname?.includes("/payment-success") || false;
  const isSuccessCheckout = pathname?.includes("/success-checkout") || false;
  const isMyschedule = pathname?.includes("/myschedule") || false;

  // Hide header and footer for payment/success pages to create full immersive experience
  const hideHeaderFooter = isPaymentSuccess || isSuccessCheckout || isMyschedule;

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <main className={`relative ${hideHeaderFooter ? 'min-h-screen' : 'min-h-screen'}`}>
        {children}
      </main>
      {!hideHeaderFooter && <Footer />}
    </>
  );
}
