import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    price: Number,
    buttonLabel: String,
    category: String,
    media: [String], // Asegura que el array de imágenes sea reconocido
  },
  { collection: "products" }
);

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
