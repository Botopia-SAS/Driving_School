import mongoose from "mongoose";

const ClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    alsoKnownAs: { type: [String], default: [] },
    length: { type: Number, required: true },
    price: { type: Number, required: true },
    overview: { type: String },
    objectives: { type: [String], default: [] },
    contact: { type: String },
    buttonLabel: { type: String },
    image: { type: String },
  },
  { collection: "drivingclasses", timestamps: true }
);

export default mongoose.models.Classes ||
  mongoose.model("Classes", ClassSchema);
