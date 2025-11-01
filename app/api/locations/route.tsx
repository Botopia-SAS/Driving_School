import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Locations from "@/models/Locations";
import Instructor from "@/models/Instructor";
import { SEO } from "@/models/SEO";

export async function GET(req: Request) {
  try {
    // console.log("🟢 Conectando a la base de datos...");
    await connectDB();
    // console.log("✅ Conectado a MongoDB");

    const { searchParams } = new URL(req.url);
    const zone = searchParams.get("zone");

    let query = {};
    if (zone) {
      query = { zone: decodeURIComponent(zone) };
    }

    // Obtener locations
    const locations = await Locations.find(query)
      .select("_id title description zone locationImage instructors")
      .populate({
        path: "instructors",
        model: Instructor,
        select: "_id name photo certifications experience"
      })
      .lean();

    if (!locations || locations.length === 0) {
      return NextResponse.json({ message: "No locations found." }, { status: 404 });
    }

    // Obtener los SEOs de las locations para agregar los slugs
    const locationIds = locations.map((loc: any) => loc._id);
    const seos = await SEO.find({
      entityId: { $in: locationIds },
      entityType: "Location"
    }).select("entityId slug").lean();

    // Crear un mapa de entityId -> slug
    const slugMap = new Map();
    seos.forEach((seo: any) => {
      if (seo.slug) {
        slugMap.set(seo.entityId.toString(), seo.slug);
      }
    });

    // Agregar el slug a cada location
    const locationsWithSlugs = locations.map((location: any) => ({
      ...location,
      slug: slugMap.get(location._id.toString()) || null
    }));

    return NextResponse.json(locationsWithSlugs);
  } catch (error) {
    // console.error("❌ Error fetching locations:", error);
    return NextResponse.json(
      { message: "Server error fetching locations", error: (error as Error).message },
      { status: 500 }
    );
  }
}
