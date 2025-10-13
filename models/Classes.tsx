import mongoose from "mongoose";

const ClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true }, // 🔹 Slug para URLs SEO-friendly
    alsoKnownAs: { type: [String], default: [] }, // 🔹 Ahora es un array de strings
    length: { type: Number, required: true },
    price: { type: Number, required: true },
    overview: { type: String },
    objectives: { type: [String], default: [] }, // 🔹 También es un array de strings
    contact: { type: String },
    buttonLabel: { type: String },
    image: { type: String },
  },
  { collection: "drivingclasses", timestamps: true } // 🔹 Nombre correcto de la colección
);

export default mongoose.models.Classes ||
  mongoose.model("Classes", ClassSchema);
