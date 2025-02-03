import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";
import { CartProvider } from "@/app/context/CartContext";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});


export const metadata: Metadata = {
  title: "Driving School",
  description: "Learn road skills for life",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <CartProvider>
        <html lang="en">
          <body className={`antialiased ${geistSans.variable}`}>
            <Header /> {/* Encabezado con navegación */}
            <main className="min-h-screen">
              {children}{" "}
              {/* Aquí se carga el contenido dinámico de cada página */}
            </main>
            <Footer /> {/* Pie de página */}
          </body>
        </html>
      </CartProvider>
    </ClerkProvider>
  );
}
