import { NextResponse } from "next/server";
import Stripe from "stripe";

// Definir la interfaz CartItem dentro de este archivo
interface CartItem {
  title: string;
  price: number;
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ STRIPE_SECRET_KEY no está definida en .env.local");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: Request) {
  try {
    console.log("📩 Recibiendo datos de pago...");

    // Especificar el tipo de items usando la interfaz CartItem
    const { items }: { items: CartItem[] } = await req.json();

    // 🔹 Crear la sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
          },
          unit_amount: item.price * 100, // Convertir a centavos
        },
        quantity: 1, // Cambia según la cantidad en el carrito
      })),
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });

    console.log("✅ Sesión de pago creada:", session.url);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("❌ Error creando la sesión de pago:", error);
    return NextResponse.json(
      { error: "Error creando la sesión de pago" },
      { status: 500 }
    );
  }
}
