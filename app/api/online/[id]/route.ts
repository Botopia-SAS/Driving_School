import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import OnlineCourses from "@/models/OnlineCourses";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const course = await OnlineCourses.findById(params.id);

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
