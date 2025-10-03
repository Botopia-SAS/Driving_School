import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  await connectDB();
  
  let requestBody;
  try {
    const text = await req.text();
    if (!text || text.trim() === '') {
      //console.log("[API][cart] Empty request body, treating as cart clear");
      requestBody = { userId: null, items: [] };
    } else {
      requestBody = JSON.parse(text);
    }
  } catch (error) {
    //console.log("[API][cart] Invalid JSON in request body:", error);
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }
    const { userId, items } = requestBody;
  //console.log("[API][cart] Saving cart for user:", userId, "with items:", items);
  
  // Si no hay userId, simplemente retornar éxito (usuario no logueado)
  if (!userId) {
    //console.log("[API][cart] No userId provided, skipping cart save");
    return NextResponse.json({ success: true, message: "No user logged in" });
  }
  
  if (!Array.isArray(items)) {
    //console.log("[API][cart] Missing or invalid items array");
    return NextResponse.json({ error: "Missing or invalid items array" }, { status: 400 });
  }
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { cart: items, updatedAt: new Date() },
      { new: true, runValidators: false }
    );
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    //console.log("[API][cart] Cart saved to user.cart:", user.cart?.length || 0, "items");
    return NextResponse.json({ success: true, cart: user.cart });
  } catch (error) {
    console.log("[API][cart] Failed to save cart:", error);
    return NextResponse.json({ error: "Failed to save cart", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  try {
    const user = await User.findById(userId).select('cart');
    if (!user || !user.cart || !Array.isArray(user.cart)) {
      return NextResponse.json({ cart: { items: [] } });
    }
    return NextResponse.json({ cart: { items: user.cart } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cart", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await connectDB();
  
  let requestBody;
  try {
    const text = await req.text();
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }
    requestBody = JSON.parse(text);
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }
  
  const { userId } = requestBody;
  
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { cart: [], updatedAt: new Date() },
      { new: true, runValidators: false }
    );
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    console.log(`🗑️ [API][cart] Cart cleared for user: ${userId}`);
    return NextResponse.json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.log("[API][cart] Failed to clear cart:", error);
    return NextResponse.json({ error: "Failed to clear cart", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 