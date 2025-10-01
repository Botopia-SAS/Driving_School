import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
import { startAndWaitEC2 } from "@/app/api/checkout/aws-ec2";
import { secureFetch } from "@/app/utils/secure-fetch";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const EC2_URL = "https://botopiapagosatldriving.xyz";

// Función helper para crear customer_code de 8 dígitos
function createCustomerCode(userId: string, orderId: string): string {
  const userSuffix = userId.slice(-4);  // últimos 4 dígitos del userId
  const orderSuffix = orderId.slice(-4); // últimos 4 dígitos del orderId
  return `${userSuffix}${orderSuffix}`;  // total: 8 dígitos
}

async function getRedirectUrlFromEC2(payload: unknown) {
  let attempt = 1;
  let lastError: string = "";
  for (let i = 0; i < 2; i++) { // máximo 2 intentos
    try {
      const ec2Response = await secureFetch(`${EC2_URL}/api/payments/redirect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (ec2Response.ok) {
        const responseData = await ec2Response.json();
        if (responseData.redirectUrl && typeof responseData.redirectUrl === "string") {
          return responseData.redirectUrl;
        } else {
          throw new Error("Invalid redirect URL received from EC2");
        }
      } else if (ec2Response.status === 401 && i === 0) {
        // Solo reintenta una vez si es 401
        lastError = await ec2Response.text();
        console.warn(`[API][cancellation] 401 recibido, reintentando. Detalle:`, lastError);
        attempt++;
        continue;
      } else {
        lastError = await ec2Response.text();
        throw new Error(`EC2 error: ${ec2Response.status} - ${lastError}`);
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[API][cancellation] Error en intento #${attempt}:`, err);
      attempt++;
    }
  }
  throw new Error(`No se pudo obtener redirectUrl del EC2 tras 2 intentos. Último error: ${lastError}`);
}

// Espera a que el backend EC2 esté listo (responda en /health)
async function waitForBackendReady(url: string, maxTries = 20, delayMs = 3000, fetchTimeoutMs = 2000) {
  for (let i = 0; i < maxTries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);
    try {
      const res = await fetch(url, { method: "GET", signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        return true;
      }
    } catch {
      // Ignora el error, solo espera y reintenta
    } finally {
      clearTimeout(timeoutId);
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Espera a que EC2 esté encendida
    console.log("🔥 [Cancellation] Llamando a startAndWaitEC2");
    const ec2Result = await startAndWaitEC2(process.env.EC2_INSTANCE_ID!);
    if (!ec2Result.success) {
      return NextResponse.json({
        error: "ec2",
        message: "No se pudo encender la instancia EC2",
        details: ec2Result.error || "Unknown error"
      }, { status: 500 });
    }

    // 2. Espera a que el backend esté listo
    const backendReady = await waitForBackendReady(`${EC2_URL}/health`);
    if (!backendReady) {
      return NextResponse.json({
        error: "ec2",
        message: "La instancia EC2 está encendida pero el backend no responde."
      }, { status: 500 });
    }

    // 3. Conectar a DB y procesar
    await connectDB();

    const {
      userId,
      instructorId,
      slotId,
      date,
      start,
      end,
      amount,
      classType
    } = await req.json();

    console.log('💳 Creating cancellation order:', {
      userId,
      instructorId,
      slotId,
      date,
      start,
      end,
      amount,
      classType
    });

    // Validate required fields
    if (!userId || !instructorId || !slotId || !date || !start || !end || !amount || classType !== 'cancel_driving_test') {
      return NextResponse.json(
        { error: "Missing required fields or invalid classType" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Generate sequential order number using simple counter to avoid race conditions
    const lastOrder = await Order.findOne({}, { orderNumber: 1 })
      .sort({ createdAt: -1 })
      .lean() as { orderNumber?: string | number } | null;

    let nextOrderNumber = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const currentNumber = parseInt(lastOrder.orderNumber.toString());
      if (!isNaN(currentNumber)) {
        nextOrderNumber = currentNumber + 1;
      }
    }

    const orderNumberStr = nextOrderNumber.toString();

    // Create order with cancellation details
    const order = new Order({
      userId,
      orderType: 'cancel_driving_test',
      items: [{
        id: `cancellation_${slotId}`,
        title: 'Driving Test Cancellation Fee',
        price: amount,
        quantity: 1,
        description: `Cancellation fee for driving test on ${date} at ${start}-${end}`
      }],
      appointments: [{
        slotId,
        instructorId,
        date,
        start,
        end,
        classType: 'cancel_driving_test',
        amount,
        status: 'pending'
      }],
      total: amount,
      estado: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
      orderNumber: orderNumberStr,
      metadata: {
        slotId,
        instructorId,
        date,
        start,
        end,
        cancellationType: 'paid',
        cancellationFee: amount
      }
    });

    await order.save();

    console.log('✅ Cancellation order created:', order._id, 'orderNumber:', orderNumberStr);

    // Create payment redirect using Elavon (Converge)
    const payload = {
      amount: Number(amount.toFixed(2)),
      firstName: user.firstName || "John",
      lastName: user.lastName || "Doe",
      email: user.email || "",
      phone: user.phoneNumber || "",
      streetAddress: user.streetAddress || "",
      city: user.city || "",
      state: user.state || "",
      zipCode: user.zipCode || "",
      dni: user.dni || "",
      items: [{
        id: `cancellation_${slotId}`,
        title: 'Driving Test Cancellation Fee',
        name: 'Driving Test Cancellation Fee',
        price: amount,
        quantity: 1,
        description: `Cancellation fee for driving test on ${date} at ${start}-${end}`
      }],
      // IDs en múltiples formas para mayor compatibilidad
      userId: userId,
      orderId: order._id.toString(),
      user_id: userId,
      order_id: order._id.toString(),
      customUserId: userId,
      customOrderId: order._id.toString(),
      userIdentifier: userId,
      orderIdentifier: order._id.toString(),

      // Datos codificados como respaldo
      encodedData: `uid:${userId}|oid:${order._id.toString()}`,
      backupData: `${userId}:${order._id.toString()}`,

      // Metadata adicional
      metadata: {
        userId: userId,
        orderId: order._id.toString(),
        timestamp: Date.now(),
        source: "cancellation-checkout",
        classType: 'cancel_driving_test'
      },

      // 🔑 CUSTOMER_CODE para ConvergePay (8 dígitos máximo)
      customer_code: createCustomerCode(userId, order._id.toString()),
      customerCode: createCustomerCode(userId, order._id.toString()),

      // URLs de redirección
      cancelUrl: `${BASE_URL}/Book-Now`,
      successUrl: `${BASE_URL}/payment-success?userId=${userId}&orderId=${order._id}`
    };

    console.log('🔄 Getting redirect URL from EC2...');
    const redirectUrl = await getRedirectUrlFromEC2(payload);
    console.log('✅ Redirect URL obtained:', redirectUrl);

    return NextResponse.json({
      success: true,
      orderId: order._id,
      checkoutUrl: redirectUrl
    });

  } catch (error) {
    console.error("❌ Error creating cancellation order:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
