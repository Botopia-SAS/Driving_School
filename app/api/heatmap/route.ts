import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const textBody = await req.text();
    if (!textBody) {
      console.warn("🚨 Body vacío en la solicitud de Heatmap");
      return NextResponse.json({ success: false, error: "Body vacío" }, { status: 400 });
    }

    let data;
    try {
      data = JSON.parse(textBody);
    } catch (error) {
      console.error("🚨 Error al parsear JSON:", error);
      return NextResponse.json({ success: false, error: "JSON inválido" }, { status: 400 });
    }

    const { x, y, pathname, event_type, screen_width, screen_height, device, device_model, browser, key_pressed, user_id, time_spent } = data;

    // ✅ Log the heatmap data instead of storing in external database
    console.log("📊 Heatmap Data:", {
      x,
      y,
      pathname,
      event_type,
      screen_width,
      screen_height,
      device,
      device_model,
      browser,
      key_pressed,
      user_id,
      time_spent,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("🚨 Error inesperado en API Heatmap:", error);
    return NextResponse.json({ success: false, error: "Error inesperado en el servidor" }, { status: 500 });
  }
}