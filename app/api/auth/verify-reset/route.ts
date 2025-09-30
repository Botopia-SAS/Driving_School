import { NextRequest, NextResponse } from 'next/server';
import Instructor from '@/models/Instructor';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import PasswordResetCode from '@/models/PasswordResetCode';

const resetCodeStore: Record<string, { code: string; expires: number }> = globalThis._resetCodeStore || (globalThis._resetCodeStore = {});

export async function POST(req: NextRequest) {
  await connectDB();
  const { email, code, password } = await req.json();
  if (!email || !code || !password) {
    return NextResponse.json({ error: 'Email, code, and password are required.' }, { status: 400 });
  }
  // Buscar el código en la base de datos
  const codeDoc = await PasswordResetCode.findOne({ email: email.trim().toLowerCase(), code, used: false });
  if (!codeDoc) {
    return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 401 });
  }
  if (codeDoc.expires < new Date()) {
    await PasswordResetCode.deleteOne({ _id: codeDoc._id });
    return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 401 });
  }
  // Marcar el código como usado y eliminarlo
  await PasswordResetCode.deleteOne({ _id: codeDoc._id });
  // Buscar usuario
  let user = await Instructor.findOne({ email });
  let userType = 'instructor';
  if (!user) {
    user = await User.findOne({ email });
    userType = 'user';
  }
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  // Hashear la nueva contraseña
  const hashed = await bcrypt.hash(password, 10);

  // Update password using findByIdAndUpdate or findOneAndUpdate
  if (userType === 'instructor') {
    await Instructor.findByIdAndUpdate(user._id, { password: hashed }, { runValidators: false });
  } else {
    await User.findByIdAndUpdate(user._id, { password: hashed }, { runValidators: false });
  }
  return NextResponse.json({ success: true, userType });
} 