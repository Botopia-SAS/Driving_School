import mongoose, { Schema, Document } from "mongoose";

// Interface para el número de teléfono principal del sitio
export interface IPhone extends Document {
  key: string; // Siempre será "main" - solo un registro en la DB
  phoneNumber: string; // El número que se usa en toda la aplicación, ej: "(561) 969-0150"
  createdAt: Date;
  updatedAt: Date;
}

const PhoneSchema: Schema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "main",
      immutable: true, // No se puede cambiar
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Phone = mongoose.models.Phone || mongoose.model<IPhone>("Phone", PhoneSchema);

export default Phone;
