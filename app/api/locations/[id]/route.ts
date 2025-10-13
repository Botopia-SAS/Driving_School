import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Location from "@/models/Locations";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    let location;

    // Primero intentar buscar por ObjectId si es válido
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      location = await Location.findById(id).populate('instructors').lean();
    }

    // Si no se encuentra por ID, intentar buscar por slug
    if (!location) {
      location = await Location.findOne({ slug: id }).populate('instructors').lean();
    }

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
