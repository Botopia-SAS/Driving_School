import mongoose, { Schema, Document } from "mongoose";

export interface ITicketClass extends Document {
  locationId: mongoose.Schema.Types.ObjectId;
  date: Date;
  hour: string;
  endhour?: string;
  classId: mongoose.Schema.Types.ObjectId;
  type: string;
  duration: string;
  instructorId?: mongoose.Schema.Types.ObjectId;
  students: {
    studentId: mongoose.Schema.Types.ObjectId;
    reason?: string;
    citation_number?: string;
    citation_ticket?: string;
    course_country?: string;
  }[];
  students_cancelled?: mongoose.Schema.Types.ObjectId[];
  studentRequests?: {
    studentId: mongoose.Schema.Types.ObjectId;
    requestDate: Date;
    status: 'pending' | 'accepted' | 'rejected';
    paymentMethod?: 'online' | 'local';
  }[];
  cupos?: number;
  spots?: number;
}

const TicketClassSchema = new Schema<ITicketClass>(
  {
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    date: { type: Date, required: true },
    hour: { type: String, required: true },
    endhour: { type: String, required: false },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Classes", required: true },
    type: { type: String, required: true },
    duration: { type: String, required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "Instructor", required: false },
    students: [
      {
        type: mongoose.Schema.Types.Mixed,
        required: false
      }
    ],
    students_cancelled: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
      }
    ],
    studentRequests: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        requestDate: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        paymentMethod: { type: String, enum: ['online', 'local'], required: false }
      }
    ],
    cupos: { type: Number, required: false },
    spots: { type: Number, required: false },
  },
  { collection: "ticketclasses", timestamps: true }
);

const TicketClass = mongoose.models.TicketClass || mongoose.model<ITicketClass>("TicketClass", TicketClassSchema);
export default TicketClass; 