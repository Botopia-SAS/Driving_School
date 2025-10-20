import mongoose, { Schema, Document } from "mongoose";

export interface IChecklistItem {
  name: string;
  completed: boolean;
  completedAt?: Date | string;
  rating?: number; // 1-10 stars
  comments?: string;
  tally?: number;
}

export interface INote {
  text: string;
  date: Date | string;
}

export interface ISessionChecklist extends Document {
  sessionId: string; // Changed to string to support custom IDs from schedule
  studentId: string; // Changed to string
  instructorId: string; // Changed to string
  checklistType: string; // e.g., "Driving Skills Basics"
  items: IChecklistItem[];
  notes: INote[]; // Added notes array
  createdAt?: Date;
  updatedAt?: Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>({
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Schema.Types.Mixed }, // Allow both Date and String
  rating: { type: Number, min: 1, max: 10 }, // Changed to 1-10 to match frontend
  comments: { type: String },
  tally: { type: Number, default: 0 }
}, { _id: false });

const NoteSchema = new Schema<INote>({
  text: { type: String, required: true },
  date: { type: Schema.Types.Mixed, default: Date.now } // Allow both Date and String
}, { _id: false });

const SessionChecklistSchema = new Schema<ISessionChecklist>({
  sessionId: { type: String, required: true }, // Changed to String
  studentId: { type: String, required: true }, // Changed to String
  instructorId: { type: String, required: true }, // Changed to String
  checklistType: { type: String, required: true },
  items: { type: [ChecklistItemSchema], default: [] },
  notes: { type: [NoteSchema], default: [] } // Added notes array
}, { timestamps: true });

// Índice único para evitar duplicados
SessionChecklistSchema.index({ sessionId: 1, checklistType: 1 }, { unique: true });

const SessionChecklist = mongoose.models.SessionChecklist || mongoose.model<ISessionChecklist>("SessionChecklist", SessionChecklistSchema);
export default SessionChecklist;
