import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Order from "@/models/Order";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    console.log("🔍 Checking transaction status:", body);

    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing orderId parameter" },
        { status: 400 }
      );
    }

    // Buscar la transacción por orderId
    const transaction = await Transaction.findOne({ 
      orderIdFromApp: orderId 
    });

    // También buscar todas las transacciones para este orderId para debugging
    const allTransactions = await Transaction.find({ 
      orderIdFromApp: orderId 
    });
    
    if (allTransactions.length > 1) {
      console.log("⚠️ Multiple transactions found for orderId:", orderId);
      console.log("📊 Transaction count:", allTransactions.length);
      allTransactions.forEach((t, index) => {
        console.log(`Transaction ${index + 1}:`, {
          _id: t._id,
          orderId: t.orderId,
          status: t.status,
          resultMessage: t.resultMessage,
          createdAt: t.createdAt
        });
      });
    }

    if (!transaction) {
      console.log("⚠️ No transaction found locally for orderId:", orderId);

      // 🔥 NUEVO: Consultar al backend EC2 si no se encuentra localmente
      try {
        console.log("🌐 Consultando backend EC2 para orderId:", orderId);
        const ec2Response = await fetch(`https://botopiapagosatldriving.xyz/api/payment-status/order/${orderId}/transactions`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (ec2Response.ok) {
          const ec2Data = await ec2Response.json();
          console.log("📊 Datos del backend EC2:", ec2Data);

          if (ec2Data.success && ec2Data.transactions && ec2Data.transactions.length > 0) {
            const ec2Transaction = ec2Data.transactions[0]; // Tomar la más reciente

            // Guardar la transacción localmente para futuras consultas
            try {
              await Transaction.create({
                orderId: ec2Transaction.orderId,
                orderIdFromApp: orderId,
                userId: ec2Transaction.userId,
                status: ec2Transaction.status,
                amount: ec2Transaction.amount,
                transactionId: ec2Transaction.transactionId,
                resultMessage: ec2Transaction.resultMessage,
                approvalCode: ec2Transaction.approvalCode,
                invoiceNumber: ec2Transaction.invoiceNumber,
                customerCode: ec2Transaction.customerCode,
                rawWebhook: ec2Transaction.rawWebhook || {},
                createdAt: ec2Transaction.createdAt
              });
              console.log("✅ Transacción del EC2 guardada localmente");
            } catch (saveError) {
              console.error("⚠️ Error guardando transacción del EC2:", saveError);
            }

            // Continuar con la verificación usando los datos del EC2
            if (ec2Transaction.status === "APPROVED") {
              console.log("✅ Transaction from EC2 is APPROVED, updating order status");

              const order = await Order.findById(orderId);
              if (!order) {
                return NextResponse.json({
                  success: false,
                  message: "Order not found",
                  transactionStatus: ec2Transaction.status
                });
              }

              if (order.paymentStatus === "completed" && order.estado === "completed") {
                return NextResponse.json({
                  success: true,
                  message: "Order already completed",
                  transactionStatus: ec2Transaction.status,
                  orderStatus: "completed"
                });
              }

              const updateResponse = await fetch(`${req.nextUrl.origin}/api/orders/update-status`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderId: orderId,
                  status: "completed",
                  paymentStatus: "completed"
                }),
              });

              if (updateResponse.ok) {
                return NextResponse.json({
                  success: true,
                  message: "Order updated to completed (from EC2 data)",
                  transactionStatus: ec2Transaction.status,
                  orderStatus: "completed"
                });
              } else {
                return NextResponse.json({
                  success: false,
                  message: "Failed to update order",
                  transactionStatus: ec2Transaction.status
                });
              }
            } else {
              return NextResponse.json({
                success: false,
                message: "Transaction not approved yet (from EC2)",
                transactionStatus: ec2Transaction.status,
                resultMessage: ec2Transaction.resultMessage
              });
            }
          }
        }
      } catch (ec2Error) {
        console.error("❌ Error consultando backend EC2:", ec2Error);
      }

      // Si tampoco se encontró en EC2, devolver not_found
      return NextResponse.json({
        success: false,
        message: "No transaction found",
        status: "not_found"
      });
    }

    console.log("📊 Transaction found:", {
      orderId: transaction.orderId,
      status: transaction.status,
      resultMessage: transaction.resultMessage
    });

    // Verificar si la transacción está aprobada
    if (transaction.status === "APPROVED" || transaction.resultMessage === "APPROVAL") {
      console.log("✅ Transaction is APPROVED, updating order status");
      
      // Buscar la orden primero para verificar su estado actual
      const order = await Order.findById(orderId);
      if (!order) {
        console.log("❌ Order not found:", orderId);
        return NextResponse.json({
          success: false,
          message: "Order not found",
          transactionStatus: transaction.status
        });
      }

      // Solo actualizar si no está ya completada
      if (order.paymentStatus === "completed" && order.estado === "completed") {
        console.log("✅ Order already completed, no update needed");
        return NextResponse.json({
          success: true,
          message: "Order already completed",
          transactionStatus: transaction.status,
          orderStatus: "completed"
        });
      }
      
      // Use the new update-status endpoint to handle order completion and instructor updates
      const updateResponse = await fetch(`${req.nextUrl.origin}/api/orders/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          status: "completed",
          paymentStatus: "completed"
        }),
      });

      if (updateResponse.ok) {
        console.log("✅ Order status updated to completed via update-status endpoint");
        
        return NextResponse.json({
          success: true,
          message: "Order updated to completed",
          transactionStatus: transaction.status,
          orderStatus: "completed"
        });
      } else {
        console.log("⚠️ Failed to update order");
        return NextResponse.json({
          success: false,
          message: "Failed to update order",
          transactionStatus: transaction.status
        });
      }
    } else {
      console.log("⏳ Transaction is not approved yet:", transaction.status);
      return NextResponse.json({
        success: false,
        message: "Transaction not approved yet",
        transactionStatus: transaction.status,
        resultMessage: transaction.resultMessage
      });
    }

  } catch (error) {
    console.error("❌ Error checking transaction status:", error);
    return NextResponse.json(
      { error: "Failed to check transaction status", details: error.message },
      { status: 500 }
    );
  }
}
