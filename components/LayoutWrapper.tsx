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
  const isMyschedule = pathname?.includes("/myschedule") || false;

  return (
    <>
      {!isPaymentSuccess && !isMyschedule && <Header />}
      <main className={`relative ${isPaymentSuccess || isMyschedule ? 'min-h-screen' : 'min-h-screen'}`}>
        {children}
      </main>
      {!isPaymentSuccess && !isMyschedule && <Footer />}
    </>
  );
}
