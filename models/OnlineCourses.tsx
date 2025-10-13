import mongoose, { Schema, Document } from "mongoose";

export interface IOnlineCourse extends Document {
  title: string;
  slug?: string;
  description: string;
  image: string;
  hasPrice: boolean;
  price: number;
  type: string;
  buttonLabel: string;
  createdAt: Date;
}

const OnlineCourseSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true }, // 🔹 Slug para URLs SEO-friendly
    description: { type: String, required: true },
    image: { type: String, required: true },
    hasPrice: { type: Boolean, required: true, default: false },
    price: { type: Number, required: true, default: 0 },
    type: { type: String, required: true },
    buttonLabel: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.OnlineCourse ||
  mongoose.model<IOnlineCourse>("OnlineCourse", OnlineCourseSchema);
