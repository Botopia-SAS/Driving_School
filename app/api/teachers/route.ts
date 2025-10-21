import { NextRequest, NextResponse } from "next/server";
import Instructor from "@/models/Instructor";
import { connectDB } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const instructorId = searchParams.get("id");
  if (!instructorId) {
    return NextResponse.json({ error: "Missing instructor id" }, { status: 400 });
  }
  const instructor = await Instructor.findById(instructorId).lean();
  if (!instructor || Array.isArray(instructor)) {
    return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
  }
  // Devuelve todos los datos relevantes
  return NextResponse.json({
    name: instructor.name,
    photo: instructor.photo,
    schedule: instructor.schedule,
    certifications: instructor.certifications,
    experience: instructor.experience,
    canTeachTicketClass: instructor.canTeachTicketClass,
    canTeachDrivingTest: instructor.canTeachDrivingTest,
    canTeachDrivingLesson: instructor.canTeachDrivingLesson,
  });
} 