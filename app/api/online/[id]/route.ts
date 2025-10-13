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
    const { id } = await params;
    const course = await OnlineCourses.findById(id);

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
