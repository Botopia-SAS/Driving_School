import mongoose, { Schema, Document } from "mongoose";

// Interface for cart items
interface ICartItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  type?: string;
  [key: string]: unknown; // For additional properties
}

export interface IUser extends Document {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  dni: string;
  ssnLast4?: string;
  hasLicense: boolean;
  licenseNumber?: string;
  birthDate: string;
  streetAddress?: string;
  apartmentNumber?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber: string;
  sex: string;
  password: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
  privateNotes?: string;
  photo?: string;
  classReminder?: boolean;
  drivingTestReminder?: boolean;
  cart?: ICartItem[]; // Cart items for driving lessons
}

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  middleName: { type: String, required: false, default: "" },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  dni: { type: String, required: true },
  ssnLast4: { type: String, required: false, default: "0000" },
  hasLicense: { type: Boolean, required: true },
  licenseNumber: { type: String, required: false, default: "" },
  birthDate: { type: String, required: true },
  streetAddress: { type: String, required: false, default: "" },
  apartmentNumber: { type: String, required: false, default: "" },
  city: { type: String, required: false, default: "" },
  state: { type: String, required: false, default: "" },
  zipCode: { type: String, required: false, default: "" },
  phoneNumber: { type: String, required: true },
  sex: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  privateNotes: { type: String, required: false },
  photo: { type: String, required: false },
  classReminder: { type: Boolean, default: false },
  drivingTestReminder: { type: Boolean, default: false },
  cart: { type: [Schema.Types.Mixed], default: [] }, // Cart items for driving lessons
}, { 
  timestamps: true,
  strict: false // Allow additional fields without validation errors
});

// Add virtual for full name
UserSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Ensure virtuals are included when converting to JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User; 