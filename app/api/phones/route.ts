import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Phone from "@/models/Phone";

// GET - Obtener el número de teléfono principal
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Buscar el número principal (key: "main")
    let phone = await Phone.findOne({ key: "main" });

    // Si no existe, crear uno por defecto
    if (!phone) {
      phone = await Phone.create({
        key: "main",
        phoneNumber: "(561) 969-0150",
      });
    }

    return NextResponse.json({
      success: true,
      data: phone,
    });
  } catch (error) {
    console.error("Error fetching phone:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching phone number",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// PUT - Actualizar el número de teléfono principal
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "phoneNumber is required",
        },
        { status: 400 }
      );
    }

    // Actualizar o crear el número principal
    const updatedPhone = await Phone.findOneAndUpdate(
      { key: "main" },
      {
        phoneNumber,
      },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedPhone,
      message: "Phone number updated successfully",
    });
  } catch (error) {
    console.error("Error updating phone:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error updating phone number",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
