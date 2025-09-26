import { Schema, Document, models, model } from "mongoose";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSection {
  label: string;
  questions: FAQItem[];
}

export interface FAQDocument extends Document {
  sections: {
    [key: string]: FAQSection;
  };
}

const FAQSchema = new Schema<FAQDocument>({
  sections: {
    type: Schema.Types.Mixed,
    default: {},
  },
});

export default models.FAQ || model<FAQDocument>("FAQ", FAQSchema, "faq"); 