import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking cart status for user:", userId);

    // Get cart from user.cart field in users collection
    const user = await User.findById(userId).select('cart');

    if (!user || !user.cart || !Array.isArray(user.cart)) {
      console.log("✅ No cart found for user, returning empty cart");
      return NextResponse.json({
        success: true,
        cartItems: [],
        cartCount: 0
      });
    }

    // Filter out corrupted items (items with undefined id, title, or price)
    const validItems = user.cart.filter((item: any) =>
      item.id &&
      item.title &&
      typeof item.price === 'number' &&
      item.price > 0
    );

    console.log("✅ Cart found in user.cart, total items:", user.cart.length);
    console.log("✅ Valid items after filtering:", validItems.length);

    if (validItems.length !== user.cart.length) {
      console.log("🧹 Found corrupted items, cleaning cart...");
      // Update user.cart with only valid items
      await User.findByIdAndUpdate(
        userId,
        { cart: validItems }
      );
    }

    return NextResponse.json({
      success: true,
      cartItems: validItems,
      cartCount: validItems.length
    });

  } catch (error) {
    console.error("❌ Error checking cart status:", error);
    return NextResponse.json(
      { error: "Failed to check cart status", details: error.message },
      { status: 500 }
    );
  }
}
