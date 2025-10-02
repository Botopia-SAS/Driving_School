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

// Interface for driving test bookings
interface IDrivingTestBooking {
  slotId: string;
  instructorId: string;
  instructorName?: string;
  date: string;
  start: string;
  end: string;
  amount: number;
  bookedAt: Date;
  orderId?: string;
  status: 'booked' | 'cancelled';
  redeemed?: boolean; // Indicates if this booking was created by redeeming a cancelled slot
  redeemedFrom?: string; // SlotId of the cancelled slot that was redeemed
}

// Interface for driving lesson bookings
interface IDrivingLessonBooking {
  slotId: string;
  instructorId: string;
  instructorName?: string;
  date: string;
  start: string;
  end: string;
  amount: number;
  bookedAt: Date;
  orderId?: string;
  status: 'booked' | 'cancelled';
  pickupLocation?: string;
  dropoffLocation?: string;
  redeemed?: boolean;
  redeemedFrom?: string;
}

export interface IUser extends Document {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  secondaryPhoneNumber: string;
  ssnLast4?: string;
  hasLicense: boolean;
  licenseNumber?: string;
  birthDate: string;
  streetAddress?: string;
  apartmentNumber?: string;
  city?: string;
  state?: string;
  zipCode?: string;
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
  driving_test_bookings?: IDrivingTestBooking[]; // Active booked driving tests
  driving_test_cancelled?: IDrivingTestBooking[]; // Cancelled driving tests (redeemable)
}

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  middleName: { type: String, required: false, default: "" },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  secondaryPhoneNumber: { type: String, required: true },
  ssnLast4: { type: String, required: false, default: "0000" },
  hasLicense: { type: Boolean, required: true },
  licenseNumber: { type: String, required: false, default: "" },
  birthDate: { type: String, required: true },
  streetAddress: { type: String, required: false, default: "" },
  apartmentNumber: { type: String, required: false, default: "" },
  city: { type: String, required: false, default: "" },
  state: { type: String, required: false, default: "" },
  zipCode: { type: String, required: false, default: "" },
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
  driving_test_bookings: {
    type: [{
      slotId: String,
      instructorId: String,
      instructorName: String,
      date: String,
      start: String,
      end: String,
      amount: Number,
      bookedAt: Date,
      orderId: String,
      status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },
      redeemed: { type: Boolean, default: false },
      redeemedFrom: String
    }],
    default: []
  },
  driving_test_cancelled: {
    type: [{
      slotId: String,
      instructorId: String,
      instructorName: String,
      date: String,
      start: String,
      end: String,
      amount: Number,
      bookedAt: Date,
      cancelledAt: Date,
      orderId: String,
      status: { type: String, enum: ['booked', 'cancelled'], default: 'cancelled' }
    }],
    default: []
  },
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