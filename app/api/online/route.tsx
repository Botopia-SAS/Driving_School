import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import OnlineCourses from "@/models/OnlineCourses";

export async function GET() {  // <-- Eliminamos el parámetro no utilizado
  try {
    await connectDB();

    const courses = await OnlineCourses.find(
      {},
      "title slug description image hasPrice price type buttonLabel"
    );

    if (!courses || courses.length === 0) {
      return NextResponse.json(
        { message: "No hay cursos registrados." },
        { status: 404 }
      );
    }

    return NextResponse.json(courses);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error en el servidor al obtener cursos", error: errorMessage },
      { status: 500 }
    );
  }
}