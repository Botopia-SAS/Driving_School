import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Cart from "@/models/Cart";
import mongoose from "mongoose";
import { addClient, removeClient } from "@/lib/cartUpdates";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }

    // Validate userId format if it's a MongoDB ObjectId
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      return new Response("Invalid userId format", { status: 400 });
    }

    const stream = new ReadableStream({
      start(controller) {
        let isClosed = false;
        let client: any = null;

        const closeConnection = () => {
          if (!isClosed) {
            isClosed = true;
            try {
              if (client) {
                removeClient(client);
              }
              controller.close();
            } catch (error) {
              // Controller might already be closed, ignore error
            }
          }
        };

        try {
          // Guardar el cliente
          client = { controller, userId };
          addClient(client);

          // Enviar un evento inicial
          controller.enqueue(
            `data: ${JSON.stringify({ type: "init", cart: [] })}\n\n`
          );

          // Limpiar al cerrar conexión - solo un event listener
          request.signal.addEventListener("abort", () => {
            // AbortSignal may carry a reason in newer runtimes
            try {
              const reason = (request.signal as any)?.reason;
              if (reason)
                console.log("SSE connection aborted, reason:", reason);
            } catch {}
            closeConnection();
          });
        } catch (error) {
          console.error("Error in SSE stream setup:", error);
          closeConnection();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("Error in cart updates SSE:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
