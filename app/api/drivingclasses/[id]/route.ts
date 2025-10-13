import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Classes from "@/models/Classes";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    let drivingClass;

    // Primero intentar buscar por ObjectId si es válido
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      drivingClass = await Classes.findById(id).lean();
    }

    // Si no se encuentra por ID, intentar buscar por slug
    if (!drivingClass) {
      drivingClass = await Classes.findOne({ slug: id }).lean();
    }

    if (!drivingClass) {
      return NextResponse.json(
        { error: "Driving class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(drivingClass);
  } catch (error) {
    console.error("Error fetching driving class:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
