import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import FAQ from '@/models/faq';

const uri = process.env.MONGODB_URI!;

export async function GET() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
  const faq = await FAQ.findOne({});
  
  // Return the sections directly
  return NextResponse.json(faq?.sections || {});
} 