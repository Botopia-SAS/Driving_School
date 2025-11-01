import mongoose from "mongoose";

const SEOSchema = new mongoose.Schema({
  metaTitle: { type: String, required: true },
  metaDescription: { type: String, required: true },
  robotsTxt: { type: String, default: "User-agent: *\nAllow: /" },
  sitemapUrl: { type: String },
  ogTitle: { type: String },
  metaImage: { type: String },
  metaKeywords: { type: String },
  slug: { type: String, unique: true, sparse: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, refPath: 'entityType' },
  entityType: { type: String, enum: ['DrivingLessons', 'DrivingClass', 'Location', 'OnlineCourse', 'General', null] },
}, { timestamps: true });

export const SEO = mongoose.models.SEO || mongoose.model("SEO", SEOSchema);
