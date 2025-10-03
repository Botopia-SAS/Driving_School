import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Order from '@/models/Order';
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

async function getRedirectUrlFromEC2(payload) {
  let attempt = 1;
  let lastError: string = "";
  for (let i = 0; i < 2; i++) { // máximo 2 intentos
    try {
      //console.log(`[API][redirect] Intento #${attempt} de obtener redirectUrl del EC2`);
      const ec2Response = await secureFetch(`${EC2_URL}/api/payments/redirect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      //console.log(`[API][redirect] Respuesta de EC2 status (intento ${attempt}):`, ec2Response.status);
      if (ec2Response.ok) {
        const responseData = await ec2Response.json();
        //console.log(`[API][redirect] Respuesta de EC2 (intento ${attempt}):`, responseData);
        if (responseData.redirectUrl && typeof responseData.redirectUrl === "string") {
          return responseData.redirectUrl;
        } else {
          throw new Error("Invalid redirect URL received from EC2");
        }
      } else if (ec2Response.status === 401 && i === 0) {
        // Solo reintenta una vez si es 401
        lastError = await ec2Response.text();
        console.warn(`[API][redirect] 401 recibido, reintentando. Detalle:`, lastError);
        attempt++;
        continue;
      } else {
        lastError = await ec2Response.text();
        throw new Error(`EC2 error: ${ec2Response.status} - ${lastError}`);
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[API][redirect] Error en intento #${attempt}:`, err);
      attempt++;
    }
  }
  throw new Error(`No se pudo obtener redirectUrl del EC2 tras 2 intentos. Último error: ${lastError}`);
}

// Espera a que el backend EC2 esté listo (responda en /health)
async function waitForBackendReady(url, maxTries = 20, delayMs = 3000, fetchTimeoutMs = 2000) {
  for (let i = 0; i < maxTries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);
    try {
      const res = await fetch(url, { method: "GET", signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        //console.log(`[EC2] Backend listo en intento ${i + 1}`);
        return true;
      }
    } catch {
      // Ignora el error, solo espera y reintenta
    } finally {
      clearTimeout(timeoutId);
    }
    //console.log(`[EC2] Esperando backend... intento ${i + 1}`);
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

export async function GET(req: NextRequest) {
  //console.log("=== INICIO /api/payments/redirect ===");
  try {
    // 1. Espera a que EC2 esté encendida
    //console.log("Llamando a startAndWaitEC2 con ID:", process.env.EC2_INSTANCE_ID);
    const ec2Result = await startAndWaitEC2(process.env.EC2_INSTANCE_ID!);
    //console.log("Resultado de startAndWaitEC2:", ec2Result);
    const ok = ec2Result.success;
    if (!ok) {
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

    // 3. Ahora conecta a la DB y procesa la orden
    await connectDB();
    //console.log("[API][redirect] DB conectada");
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const orderId = searchParams.get("orderId");
    //console.log("[API][redirect] Params:", { userId, orderId });

    if (!userId) {
      console.log("[API][redirect] Falta userId, redirigiendo a login");
      return NextResponse.redirect(`${BASE_URL}/login`);
    }
    
    const user = await User.findById(userId);
    //console.log("[API][redirect] Usuario:", user);
    if (!user) {
      //console.log("[API][redirect] Usuario no encontrado, redirigiendo a login");
      return NextResponse.redirect(`${BASE_URL}/login`);
    }

    let items, total, orderToUse;
    if (orderId) {
      //console.log("[API][redirect] Buscando orden existente:", orderId);
      orderToUse = await Order.findById(orderId);
      if (!orderToUse) {
        //console.log("[API][redirect] Orden no encontrada, redirigiendo a home");
        return NextResponse.redirect(`${BASE_URL}/?error=order-not-found`);
      }

      // Build items with proper description based on orderType
      const orderType = orderToUse.orderType || 'general';
      const description = orderType === 'drivings' ? 'drivings' :
                         orderType === 'driving_test' ? 'driving test' :
                         orderType === 'driving_lesson' ? 'driving lesson' :
                         orderType === 'ticket_class' ? 'ticket class' :
                         orderType === 'ticket_class_cancellation' ? 'cancelation ticket' :
                         'driving services';

      items = orderToUse.items && orderToUse.items.length > 0
        ? orderToUse.items.map(item => ({
            ...item,
            description: description
          }))
        : [{
            id: orderToUse._id.toString(),
            title: orderType === 'ticket_class_cancellation' ? 'Ticket Class Cancellation Fee' : 'Service',
            name: orderType === 'ticket_class_cancellation' ? 'Ticket Class Cancellation Fee' : 'Service',
            price: orderToUse.total || 0,
            quantity: 1,
            description: description
          }];

      total = orderToUse.total;
      console.log("[API][redirect] Usando orden existente", { orderType, description, items, total });
    } else {
      //console.log("[API][redirect] Buscando carrito para usuario:", userId);
      
      // Buscar en el carrito del usuario (para driving-lessons)
      console.log("[API][redirect] User object:", {
        _id: user?._id,
        name: user?.name,
        cartLength: user?.cart?.length,
        cart: user?.cart
      });
      
      if (user && user.cart && user.cart.length > 0) {
        console.log("[API][redirect] Carrito encontrado en usuario:", user.cart.length, "items");
        
        // Filtrar solo items válidos para el pago (que tengan price O amount como número)
        const validItems = user.cart.filter(item => 
          item && 
          ((typeof item.price === 'number' && !isNaN(item.price) && item.price > 0) ||
           (typeof item.amount === 'number' && !isNaN(item.amount) && item.amount > 0)) &&
          (item.id || item.classType) &&
          (item.title || item.classType)
        );
        
        console.log("[API][redirect] Items válidos para pago:", validItems.length);
        console.log("[API][redirect] Items inválidos filtrados:", user.cart.length - validItems.length);
        
        // Debug detailed cart items
        user.cart.forEach((item, index) => {
          console.log(`[API][redirect] Cart item ${index}:`, {
            id: item.id,
            classType: item.classType,
            ticketClassId: item.ticketClassId,
            price: item.price,
            amount: item.amount,
            title: item.title,
            hasValidPrice: (typeof item.price === 'number' && !isNaN(item.price) && item.price > 0) ||
                          (typeof item.amount === 'number' && !isNaN(item.amount) && item.amount > 0),
            hasValidId: !!(item.id || item.classType),
            hasValidTitle: !!(item.title || item.classType),
            isValid: validItems.includes(item)
          });
        });
        
        if (validItems.length === 0) {
          console.log("[API][redirect] No hay items válidos en el carrito para procesar pago");
          return NextResponse.json({ 
            error: "cart", 
            message: "No valid items found in cart for payment processing." 
          }, { status: 400 });
        }
        
        // Determinar orderType ANTES de procesar items
        const hasTickets = validItems.some(item => item.classType === 'ticket');
        const hasDrivingTests = validItems.some(item => item.classType === 'driving test');
        const hasDrivingLessons = validItems.some(item => item.classType === 'driving lesson' || item.packageDetails);
        
        let preOrderType = 'general';
        if (hasTickets && hasDrivingTests) {
          preOrderType = 'classes'; // Combinación de ticket class + driving test
        } else if (hasTickets && hasDrivingLessons) {
          preOrderType = 'classes'; // Combinación de ticket class + driving lesson
        } else if (hasDrivingTests && hasDrivingLessons) {
          preOrderType = 'drivings'; // Combinación de driving test + driving lesson
        } else if (hasTickets) {
          preOrderType = 'ticket_class';
        } else if (hasDrivingTests) {
          preOrderType = 'driving_test';
        } else if (hasDrivingLessons) {
          preOrderType = 'driving_lesson';
        }
        
        // Asegurar que todos los items tengan la estructura correcta
        items = validItems.map(item => ({
          id: item.id || `driving_test_${item.instructorId}_${item.date}_${item.start}`,
          title: item.title || item.classType || 'Driving Test',
          price: Number(item.price || item.amount || 0),
          quantity: Number(item.quantity || 1),
          description: preOrderType === 'drivings' ? 'drivings' :
                      preOrderType === 'classes' ? 'classes' :
                      preOrderType === 'ticket_class_cancellation' ? 'ticketclass cancellation' :
                      (item.description || item.packageDetails ||
                      (item.classType === 'driving test' ? 'Driving test appointment' : 'Driving lesson package')),
          ...item // Mantener otros campos como packageDetails, selectedSlots, etc.
        }));
        
        total = items.reduce((sum, item) => {
          const itemTotal = item.price * item.quantity;
          console.log(`[API][redirect] Item: ${item.title}, Price: ${item.price}, Quantity: ${item.quantity}, Total: ${itemTotal}`);
          return sum + itemTotal;
        }, 0);
        
        console.log("[API][redirect] Total del carrito calculado:", total);
        
        // Validar que el total sea un número válido
        if (isNaN(total) || total <= 0) {
          console.log("[API][redirect] ❌ Total inválido calculado:", total);
          return NextResponse.json({ 
            error: "calculation", 
            message: "Invalid total calculated from cart items." 
          }, { status: 400 });
        }
      } else {
        console.log("[API][redirect] Carrito del usuario vacío o null. user.cart:", user?.cart);
        
        // Si no hay carrito, buscar órdenes pendientes del usuario (para driving-lessons)
        const pendingOrders = await Order.find({ 
          userId, 
          paymentStatus: 'pending',
          orderType: 'driving_lesson_package'
        }).sort({ createdAt: -1 });
        
        if (pendingOrders && pendingOrders.length > 0) {
          console.log("[API][redirect] Encontradas órdenes pendientes:", pendingOrders.length);
          
          // Usar la orden más reciente
          const latestOrder = pendingOrders[0];
          items = latestOrder.items;
          total = latestOrder.total;
          orderToUse = latestOrder;
          
          console.log("[API][redirect] Usando orden pendiente:", {
            orderId: latestOrder._id,
            orderNumber: latestOrder.orderNumber,
            total: latestOrder.total
          });
        } else {
          // Si no hay órdenes pendientes, verificar carrito del usuario
          if (!user.cart || user.cart.length === 0) {
            console.log("[API][redirect] Carrito vacío en todas las ubicaciones, redirigiendo a home");
            return NextResponse.redirect(`${BASE_URL}/?error=cart-empty`);
          }
          items = user.cart;
          total = user.cart.reduce((sum, item) => sum + (item.price || item.amount || 0) * (item.quantity || 1), 0);
        }
      }
      //console.log("[API][redirect] Carrito encontrado", { items, total });
    }

    let finalOrderId: string;
    if (!orderId) {
      if (orderToUse) {
        // Si ya tenemos una orden (como en driving-lessons), usarla
        console.log("[API][redirect] Usando orden existente:", orderToUse._id);
        finalOrderId = orderToUse._id.toString();
        
        // Actualizar el estado de pago de la orden
        await Order.updateOne(
          { _id: orderToUse._id },
          { $set: { paymentStatus: 'processing' } }
        );
        console.log("[API][redirect] Estado de pago de orden actualizado a 'processing'");
      } else {
        // Determinar el tipo de orden basado en los items del carrito
        const hasTickets = items.some(item => item.classType === 'ticket');
        const hasDrivingTests = items.some(item => item.classType === 'driving test');
        const hasDrivingLessons = items.some(item => item.classType === 'driving lesson' || item.packageDetails);
        
        let currentOrderType = 'general';
        
        // Prioridad: 1. Si hay tickets → ticket_class
        if (hasTickets) {
          currentOrderType = 'ticket_class';
        }
        // 2. Si hay driving test + driving lesson → drivings  
        else if (hasDrivingTests && hasDrivingLessons) {
          currentOrderType = 'drivings';
        } 
        // 3. Solo driving test → driving_test
        else if (hasDrivingTests) {
          currentOrderType = 'driving_test';
        } 
        // 4. Solo driving lesson → driving_lesson
        else if (hasDrivingLessons) {
          currentOrderType = 'driving_lesson';
        }
        
        // Verificar si ya existe una orden pendiente del MISMO TIPO para este usuario
        console.log("[API][redirect] Verificando si ya existe una orden pendiente del tipo:", currentOrderType);
        const existingOrder = await Order.findOne({
          userId: userId,
          paymentStatus: 'pending',
          orderType: currentOrderType // ← IMPORTANTE: Verificar el mismo tipo
        }).sort({ createdAt: -1 });
        
        if (existingOrder) {
          console.log("[API][redirect] Usando orden existente del mismo tipo:", existingOrder._id);
          finalOrderId = existingOrder._id.toString();
        } else {
          // Crear nueva orden con el tipo correcto
          console.log("[API][redirect] Creando nueva orden de tipo:", currentOrderType);

          // Generate unique order number using timestamp + random to avoid duplicates
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
          const orderNumberStr = `${timestamp}-${randomSuffix}`;
          console.log("[API][redirect] Número de orden único generado:", orderNumberStr);
          
          // Crear appointments - SIEMPRE para cualquier item que tenga información de cita
          const appointments: Array<{
            slotId?: string;
            instructorId: string;
            instructorName?: string;
            date: string;
            start: string;
            end: string;
            classType?: string;
            ticketClassId?: string;
            studentId?: string;
            amount?: number;
            status?: string;
            [key: string]: unknown;
          }> = [];
          
          // Procesar cada item del carrito para crear appointments
          console.log(`[API][redirect] GET - Processing ${items.length} items for appointments:`);
          items.forEach((item, index) => {
              console.log(`[API][redirect] GET - Processing item ${index}:`, {
                classType: item.classType,
                ticketClassId: item.ticketClassId,
                id: item.id,
                title: item.title
              });
              if (item.classType === 'driving test') {
                appointments.push({
                  slotId: item.slotId || `${item.date}-${item.start}-${item.end}`, // Use real slotId from cart
                  instructorId: item.instructorId,
                  instructorName: item.instructorName,
                  date: item.date,
                  start: item.start,
                  end: item.end,
                  classType: 'driving test',
                  amount: item.price || 50,
                  status: 'pending'
                });
              } else if (item.classType === 'driving lesson' || item.packageDetails) {
                // Para driving lesson packages, crear appointments usando slotDetails
                if (item.slotDetails && Array.isArray(item.slotDetails) && item.slotDetails.length > 0) {
                  // Crear un appointment por cada slot del paquete
                  const amountPerSlot = Math.round((item.price || 50) / item.slotDetails.length);
                  
                  item.slotDetails.forEach(slot => {
                    appointments.push({
                      slotId: slot.slotId,
                      instructorId: slot.instructorId,
                      instructorName: slot.instructorName,
                      date: slot.date,
                      start: slot.start,
                      end: slot.end,
                      classType: 'driving_lesson',
                      amount: amountPerSlot,
                      status: 'pending',
                      pickupLocation: item.packageDetails?.pickupLocation || '',
                      dropoffLocation: item.packageDetails?.dropoffLocation || ''
                    });
                  });
                } else {
                  // Fallback para driving lessons sin slotDetails
                  appointments.push({
                    slotId: item.id || `${Date.now()}-${Math.random()}`,
                    instructorId: item.instructorId || '',
                    instructorName: item.instructorName || '',
                    date: item.date || new Date().toISOString().split('T')[0],
                    start: item.start || '10:00',
                    end: item.end || '12:00',
                    classType: 'driving_lesson',
                    amount: item.price || 50,
                    status: 'pending',
                    pickupLocation: item.packageDetails?.pickupLocation || '',
                    dropoffLocation: item.packageDetails?.dropoffLocation || ''
                  });
                }
              } else if (item.classType === 'ticket') {
                console.log(`[API][redirect] GET - ✅ Creating TICKET CLASS appointment:`, {
                  ticketClassId: item.ticketClassId,
                  classId: item.id,
                  studentId: userId,
                  date: item.date,
                  start: item.start,
                  end: item.end
                });
                
                // Para ticket class, el slotId debe ser específico del slot seleccionado
                // Crear un slotId único basado en la fecha y hora seleccionada
                const ticketSlotId = `${item.ticketClassId}_${item.date}_${item.start}_${item.end}`;
                
                appointments.push({
                  slotId: ticketSlotId, // ← Usar slotId específico para el slot de ticket class
                  ticketClassId: item.ticketClassId, // ← ID de la ticket class (para buscar en TicketClass collection)
                  classId: item.id,
                  studentId: userId, // ← AGREGAR studentId para payment-success
                  instructorId: item.instructorId,
                  instructorName: item.instructorName,
                  date: item.date,
                  start: item.start,
                  end: item.end,
                  classType: 'ticket_class',
                  amount: item.price || 50,
                  status: 'pending'
                });
                
                console.log(`[API][redirect] GET - Created ticket appointment with slotId: ${ticketSlotId}`);
              } else {
                console.log(`[API][redirect] GET - ⚠️ Unknown classType:`, item.classType, 'for item:', item.id);
                
                // Para items sin classType específico pero con datos de cita, crear appointment genérico
                if (item.date && item.start && item.end && item.instructorId) {
                  appointments.push({
                    slotId: item.slotId || `${item.date}-${item.start}-${item.end}`,
                    instructorId: item.instructorId,
                    instructorName: item.instructorName || 'Instructor',
                    date: item.date,
                    start: item.start,
                    end: item.end,
                    classType: item.classType || 'general',
                    amount: item.price || 50,
                    status: 'pending'
                  });
                  console.log(`[API][redirect] GET - Created generic appointment for item:`, item.id);
                }
              }
            });
          
          console.log(`[API][redirect] GET - 🎯 Final appointments created: ${appointments.length}`);
          appointments.forEach((apt, index) => {
            console.log(`[API][redirect] GET - Appointment ${index}:`, {
              classType: apt.classType,
              ticketClassId: apt.ticketClassId,
              slotId: apt.slotId,
              studentId: apt.studentId
            });
          });
          
          // Validar que appointments no esté vacío si esperamos citas
          if ((hasDrivingTests || hasDrivingLessons || hasTickets) && appointments.length === 0) {
            console.warn(`[API][redirect] GET - ⚠️ Warning: Expected appointments but got none. Items:`, items.map(i => ({id: i.id, classType: i.classType})));
          }
          
          const orderData: Record<string, unknown> = {
            userId,
            orderType: currentOrderType,
            items,
            appointments, // Siempre incluir appointments (puede estar vacío)
            total: Number(total.toFixed(2)),
            estado: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date(),
            orderNumber: orderNumberStr,
          };
          
          console.log(`[API][redirect] GET - Creating order with ${appointments.length} appointments and orderNumber: ${orderNumberStr}`);
          
          const createdOrder = await Order.create(orderData);
          console.log("[API][redirect] Orden creada:", createdOrder._id, "tipo:", currentOrderType);
          finalOrderId = createdOrder._id.toString();
        }
        
        // Limpiar carrito del usuario (para driving-lessons)
        if (user.cart && user.cart.length > 0) {
          await User.findByIdAndUpdate(userId, { cart: [] }, { runValidators: false });
          console.log("[API][redirect] Carrito del usuario vaciado");
        }
      }
    } else if (orderToUse) {
      finalOrderId = orderToUse._id.toString();
      // Si ya existe la orden, usar su total
      total = orderToUse.total || 0;
    } else {
      // orderId existe por control de flujo anterior, afirmamos tipo
      finalOrderId = orderId as string;
      // Buscar la orden para obtener el total
      const existingOrder = await Order.findById(orderId);
      if (existingOrder) {
        total = existingOrder.total || 0;
      }
    }

    const payload = {
      amount: Number(total.toFixed(2)),
      firstName: user.firstName || "John",
      lastName: user.lastName || "Doe",
      email: user.email || "",
      phone: user.phoneNumber || "",
      streetAddress: user.streetAddress || "",
      city: user.city || "",
      state: user.state || "",
      zipCode: user.zipCode || "",
      dni: user.dni || "",
      items,
      // IDs en múltiples formas para mayor compatibilidad
      userId: userId,
      orderId: finalOrderId,
      user_id: userId,
      order_id: finalOrderId,
      customUserId: userId,
      customOrderId: finalOrderId,
      userIdentifier: userId,
      orderIdentifier: finalOrderId,

      // Datos codificados como respaldo
      encodedData: `uid:${userId}|oid:${finalOrderId}`,
      backupData: `${userId}:${finalOrderId}`,

      // Metadata adicional
      metadata: {
        userId: userId,
        orderId: finalOrderId,
        timestamp: Date.now(),
        source: "frontend-checkout"
      },

      // 🔑 CUSTOMER_CODE para ConvergePay (8 dígitos máximo)
      customer_code: createCustomerCode(userId as string, finalOrderId),
      customerCode: createCustomerCode(userId as string, finalOrderId), // alias alternativo

      // Estas URLs no se usan directamente para Converge, pero viajan al EC2
      cancelUrl: `${BASE_URL}/payment-retry?userId=${userId}&orderId=${finalOrderId}`,
      successUrl: `${BASE_URL}/payment-success?userId=${userId}&orderId=${finalOrderId}`
    };
    //console.log("[API][redirect] Payload para EC2:", payload);


    // Usar función con reintento automático
    const redirectUrl = await getRedirectUrlFromEC2(payload);
    //console.log("[API][redirect] URL de redirección válida:", redirectUrl);
    return NextResponse.json({ redirectUrl });

  } catch (error) {
     console.error("[API][redirect] ❌ Error no manejado:", error);
    if (error instanceof Error) {
       console.error("[API][redirect] ❌ Error stack:", error.stack);
    }
    return NextResponse.json({ 
      error: "payment", 
      message: "There was an error processing the payment.", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  //console.log("=== INICIO /api/payments/redirect (POST) ===");
  try {
    // 1. Espera a que EC2 esté encendida
    //console.log("Llamando a startAndWaitEC2 con ID:", process.env.EC2_INSTANCE_ID);
    const ec2Result = await startAndWaitEC2(process.env.EC2_INSTANCE_ID!);
    //console.log("Resultado de startAndWaitEC2:", ec2Result);
    const ok = ec2Result.success;
    if (!ok) {
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
        error: "backend", 
        message: "Backend no está listo",
        details: "El servidor de pagos no está respondiendo"
      }, { status: 503 });
    }

    // 3. Obtener parámetros de la URL
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');

    if (!userId || !orderId) {
      return NextResponse.json({ 
        error: "params", 
        message: "Missing required parameters",
        details: "userId and orderId are required"
      }, { status: 400 });
    }

    // 4. Conectar a la base de datos
    await connectDB();

    // 5. Buscar usuario
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ 
        error: "user", 
        message: "User not found",
        details: `User with ID ${userId} not found`
      }, { status: 404 });
    }

    // 6. Buscar orden existente o crear nueva
    const orderToUse = await Order.findById(orderId);
    let finalOrderId: string;
    let items: Array<{
      id: string;
      title: string;
      price: number;
      quantity: number;
      description?: string;
      [key: string]: unknown;
    }> = [];
    let total = 0;

    if (!orderToUse) {
      // Buscar en el carrito del usuario
      let cartItems: Array<{
        id: string;
        title: string;
        price: number;
        quantity?: number;
        classType?: string;
        instructorId?: string;
        instructorName?: string;
        date?: string;
        start?: string;
        end?: string;
        amount?: number;
        slotId?: string;
        ticketClassId?: string;
        studentId?: string;
        packageDetails?: {
          pickupLocation?: string;
          dropoffLocation?: string;
          [key: string]: unknown;
        };
        [key: string]: unknown;
      }> = [];
      
      if (user.cart && user.cart.length > 0) {
        cartItems = user.cart;
      }

      if (cartItems.length === 0) {
        return NextResponse.json({ 
          error: "cart", 
          message: "Cart is empty",
          details: "No items found in cart"
        }, { status: 400 });
      }

      // Determinar si hay diferentes tipos en el carrito
      const hasTickets = cartItems.some(item => item.classType === 'ticket');
      const hasDrivingTests = cartItems.some(item => item.classType === 'driving test');
      const hasDrivingLessons = cartItems.some(item => item.classType === 'driving lesson' || item.packageDetails);
      
      let orderType = 'general';
      let appointments: Array<{
        slotId?: string;
        instructorId: string;
        instructorName?: string;
        date: string;
        start: string;
        end: string;
        classType?: string;
        ticketClassId?: string;
        studentId?: string;
        amount?: number;
        status?: string;
        [key: string]: unknown;
      }> = [];
      
      // Prioridad: 1. Si hay tickets → ticket_class
      if (hasTickets) {
        orderType = 'ticket_class';
      }
      // 2. Si hay driving test + driving lesson → drivings  
      else if (hasDrivingTests && hasDrivingLessons) {
        orderType = 'drivings';
      } 
      // 3. Solo driving test → driving_test
      else if (hasDrivingTests) {
        orderType = 'driving_test';
      } 
      // 4. Solo driving lesson → driving_lesson
      else if (hasDrivingLessons) {
        orderType = 'driving_lesson';
      }
      
      if (hasDrivingTests || hasDrivingLessons || hasTickets) {
        appointments = [];
        
        // Procesar cada item del carrito
        console.log(`[API][redirect] Processing ${cartItems.length} cart items for appointments:`);
        cartItems.forEach((item, index) => {
          console.log(`[API][redirect] Processing item ${index}:`, {
            classType: item.classType,
            ticketClassId: item.ticketClassId,
            id: item.id,
            title: item.title
          });
          
          if (item.classType === 'driving test') {
            // Get the actual slot _id from the instructor's schedule
            let actualSlotId = item.slotId || `${item.date || 'unknown'}-${item.start || 'unknown'}-${item.end || 'unknown'}`;
            
            if (item.instructorId) {
              try {
                const instructor = await Instructor.findById(item.instructorId);
                if (instructor && instructor.schedule_driving_test) {
                  const matchingSlot = instructor.schedule_driving_test.find((slot: any) =>
                    slot.date === item.date &&
                    slot.start === item.start &&
                    slot.end === item.end &&
                    slot.studentId === userId
                  );
                  
                  if (matchingSlot && matchingSlot._id) {
                    actualSlotId = matchingSlot._id;
                    console.log(`[API][redirect] POST - Found actual slot _id: ${actualSlotId}`);
                  }
                }
              } catch (error) {
                console.warn(`[API][redirect] POST - Could not get actual slot _id:`, error);
              }
            }
            
            appointments.push({
              slotId: actualSlotId,
              instructorId: item.instructorId || '',
              instructorName: item.instructorName || '',
              date: item.date || '',
              start: item.start || '',
              end: item.end || '',
              classType: 'driving test',
              amount: item.amount || item.price || 50,
              status: 'pending'
            });
          } else if (item.classType === 'driving lesson' || item.packageDetails) {
            // Para driving lesson packages, crear appointments usando slotDetails
            if (item.slotDetails && Array.isArray(item.slotDetails) && item.slotDetails.length > 0) {
              // Crear un appointment por cada slot del paquete
              const amountPerSlot = Math.round((item.price || 50) / item.slotDetails.length);
              
              item.slotDetails.forEach(slot => {
                appointments.push({
                  slotId: slot.slotId,
                  instructorId: slot.instructorId,
                  instructorName: slot.instructorName,
                  date: slot.date,
                  start: slot.start,
                  end: slot.end,
                  classType: 'driving_lesson',
                  amount: amountPerSlot,
                  status: 'pending',
                  pickupLocation: item.packageDetails?.pickupLocation || '',
                  dropoffLocation: item.packageDetails?.dropoffLocation || ''
                });
              });
            } else {
              // Fallback para driving lessons sin slotDetails
              appointments.push({
                slotId: item.id || `${Date.now()}-${Math.random()}`,
                instructorId: item.instructorId || '',
                instructorName: item.instructorName || '',
                date: item.date || new Date().toISOString().split('T')[0],
                start: item.start || '10:00',
                end: item.end || '12:00',
                classType: 'driving_lesson',
                amount: item.price || 50,
                status: 'pending',
                pickupLocation: item.packageDetails?.pickupLocation || '',
                dropoffLocation: item.packageDetails?.dropoffLocation || ''
              });
            }
          } else if (item.classType === 'ticket') {
            console.log(`[API][redirect] POST - ✅ Creating TICKET CLASS appointment:`, {
              ticketClassId: item.ticketClassId,
              classId: item.id,
              studentId: userId,
              date: item.date,
              start: item.start,
              end: item.end
            });
            
            // Para ticket class, el slotId debe ser específico del slot seleccionado
            // Crear un slotId único basado en la fecha y hora seleccionada
            const ticketSlotId = `${item.ticketClassId}_${item.date}_${item.start}_${item.end}`;
            
            appointments.push({
              slotId: ticketSlotId, // ← Usar slotId específico para el slot de ticket class
              ticketClassId: item.ticketClassId, // ← ID de la ticket class (para buscar en TicketClass collection)
              classId: item.id,
              studentId: userId, // ← AGREGAR studentId para payment-success
              instructorId: item.instructorId || '',
              instructorName: item.instructorName || '',
              date: item.date || '',
              start: item.start || '',
              end: item.end || '',
              classType: 'ticket_class',
              amount: item.price || 50,
              status: 'pending'
            });
            
            console.log(`[API][redirect] POST - Created ticket appointment with slotId: ${ticketSlotId}`);
          } else {
            console.log(`[API][redirect] POST - ⚠️ Unknown classType:`, item.classType, 'for item:', item.id);
          }
        });
        
        // orderType ya se determinó arriba con la lógica de prioridad
        console.log(`[API][redirect] 🎯 Final appointments created: ${appointments.length}`);
        appointments.forEach((apt, index) => {
          console.log(`[API][redirect] Appointment ${index}:`, {
            classType: apt.classType,
            ticketClassId: apt.ticketClassId,
            slotId: apt.slotId,
            studentId: apt.studentId
          });
        });
      }

      // Procesar items del carrito para el payment gateway
      // Usar descripción basada en orderType para órdenes mixtas
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const orderDescription = orderType === 'drivings' ? 'drivings' :
                              orderType === 'classes' ? 'classes' :
                              orderType === 'driving_test' ? 'driving test' :
                              orderType === 'driving_lesson' ? 'driving lesson' :
                              orderType === 'ticket_class' ? 'ticket class' :
                              orderType === 'ticket_class_cancellation' ? 'ticketclass cancellation' :
                              'driving services';

      items = cartItems.map(item => ({
        id: item.id || `item-${Date.now()}-${Math.random()}`,
        title: String(item.title || item.name || (item.classType === 'driving test' ? 'Driving Test' : 'Driving Service')),
        name: String(item.title || item.name || (item.classType === 'driving test' ? 'Driving Test' : 'Driving Service')),
        quantity: item.quantity || 1,
        price: item.price || item.amount || 0,
        description: String(orderType === 'drivings' ? 'drivings' :
                    orderType === 'classes' ? 'classes' :
                    orderType === 'ticket_class_cancellation' ? 'ticketclass cancellation' :
                    (item.description || item.packageDetails ||
                    (item.classType === 'driving test' ? 'Driving test appointment' : 'Driving lesson package')))
      }));

      total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
      console.log("[API][redirect] POST - Siguiente número de orden:", orderNumberStr);

      const orderData: {
        userId: string;
        orderType: string;
        items: unknown[];
        appointments: unknown[];
        total: number;
        estado: string;
        paymentStatus: string;
        createdAt: Date;
        orderNumber: string;
      } = {
        userId,
        orderType,
        items,
        appointments, // Siempre incluir appointments
        total: Number(total.toFixed(2)),
        estado: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date(),
        orderNumber: orderNumberStr,
      };
      
      console.log(`[API][redirect] POST - Creating order with ${appointments.length} appointments and orderNumber: ${orderNumberStr}`);
      
      const createdOrder = await Order.create(orderData);
      console.log("[API][redirect] Orden creada:", createdOrder._id);
      finalOrderId = createdOrder._id.toString();
      
      // Limpiar carrito del usuario
      if (user.cart && user.cart.length > 0) {
        await User.findByIdAndUpdate(userId, { cart: [] }, { runValidators: false });
        console.log("[API][redirect] Carrito del usuario vaciado");
      }
    } else if (orderToUse) {
      finalOrderId = orderToUse._id.toString();
      // Si ya existe la orden, usar su total
      total = orderToUse.total || 0;
    } else {
      // orderId existe por control de flujo anterior, afirmamos tipo
      finalOrderId = orderId as string;
      // Buscar la orden para obtener el total
      const existingOrder = await Order.findById(orderId);
      if (existingOrder) {
        total = existingOrder.total || 0;
      }
    }

    const payload = {
      amount: Number(total.toFixed(2)),
      firstName: user.firstName || "John",
      lastName: user.lastName || "Doe",
      email: user.email || "",
      phone: user.phoneNumber || "",
      streetAddress: user.streetAddress || "",
      city: user.city || "",
      state: user.state || "",
      zipCode: user.zipCode || "",
      dni: user.dni || "",
      items,
      // IDs en múltiples formas para mayor compatibilidad
      userId: userId,
      orderId: finalOrderId,
      user_id: userId,
      order_id: finalOrderId,
      customUserId: userId,
      customOrderId: finalOrderId,
      userIdentifier: userId,
      orderIdentifier: finalOrderId,

      // Datos codificados como respaldo
      encodedData: `uid:${userId}|oid:${finalOrderId}`,
      backupData: `${userId}:${finalOrderId}`,

      // Metadata adicional
      metadata: {
        userId: userId,
        orderId: finalOrderId,
        timestamp: Date.now(),
        source: "frontend-checkout"
      },

      // 🔑 CUSTOMER_CODE para ConvergePay (8 dígitos máximo)
      customer_code: createCustomerCode(userId as string, finalOrderId),
      customerCode: createCustomerCode(userId as string, finalOrderId), // alias alternativo

      // Estas URLs no se usan directamente para Converge, pero viajan al EC2
      cancelUrl: `${BASE_URL}/payment-retry?userId=${userId}&orderId=${finalOrderId}`,
      successUrl: `${BASE_URL}/payment-success?userId=${userId}&orderId=${finalOrderId}`
    };
    //console.log("[API][redirect] Payload para EC2:", payload);


    // Usar función con reintento automático
    const redirectUrl = await getRedirectUrlFromEC2(payload);
    //console.log("[API][redirect] URL de redirección válida:", redirectUrl);
    return NextResponse.json({ redirectUrl });

  } catch (error) {
     console.error("[API][redirect] ❌ Error no manejado:", error);
    if (error instanceof Error) {
       console.error("[API][redirect] ❌ Error stack:", error.stack);
    }
    return NextResponse.json({ 
      error: "payment", 
      message: "There was an error processing the payment.", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
