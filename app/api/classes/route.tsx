import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Classes from "@/models/Classes";
import { SEO } from "@/models/SEO";

export async function GET() {
  try {
    await connectDB();

    // Obtener clases sin el campo slug del modelo
    const classes = await Classes.find({})
      .select("_id title alsoKnownAs length price overview objectives contact image buttonLabel")
      .lean();

    if (!classes || classes.length === 0) {
      return NextResponse.json({ message: "No hay clases registradas." }, { status: 404 });
    }

    // Obtener los SEOs de las clases para agregar los slugs
    const classIds = classes.map((cls: any) => cls._id);
    const seos = await SEO.find({
      entityId: { $in: classIds },
      entityType: "DrivingClass"
    }).select("entityId slug").lean();

    // Crear un mapa de entityId -> slug
    const slugMap = new Map();
    seos.forEach((seo: any) => {
      if (seo.slug) {
        slugMap.set(seo.entityId.toString(), seo.slug);
      }
    });

    // Agregar el slug a cada clase
    const classesWithSlugs = classes.map((cls: any) => ({
      ...cls,
      slug: slugMap.get(cls._id.toString()) || null
    }));

    return NextResponse.json(classesWithSlugs);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error en el servidor al obtener clases", error: errorMessage },
      { status: 500 }
    );
  }
}

