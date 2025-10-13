import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import OnlineCourses from "@/models/OnlineCourses";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    // Await params in Next.js 15
    const { id } = await params;

    let course;

    // Primero intentar buscar por ObjectId si es válido
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      course = await OnlineCourses.findById(id);
    }

    // Si no se encuentra por ID, intentar buscar por slug
    if (!course) {
      course = await OnlineCourses.findOne({ slug: id });
    }

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error fetching course details", error: errorMessage },
      { status: 500 }
    );
  }
}
