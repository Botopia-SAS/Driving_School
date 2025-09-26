import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import AuthCode from '@/models/AuthCode';
import bcrypt from 'bcryptjs';

// Handler para crear usuario (POST)
export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  //console.log("Nuevo usuario recibido:", data);

  // Si viene un código, es para verificar y crear el usuario
  if (data.code) {
    // Limpiar códigos expirados primero
    await AuthCode.deleteMany({ expires: { $lt: new Date() } });
    
    // Verificar el código
    const authCode = await AuthCode.findOne({ 
      email: data.email.trim().toLowerCase(), 
      code: data.code, 
      used: false 
    });

    if (!authCode || authCode.expires < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 400 });
    }

    // Verificar que el email no esté ya registrado
    const exists = await User.findOne({ email: data.email });
    if (exists) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
    }

    // Eliminar el código de verificación usado
    await AuthCode.findByIdAndDelete(authCode._id);

    // Encriptar la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Crear el usuario en la base de datos
    try {
      const newUser = new User({
        firstName: data.firstName,
        middleName: data.middleName || "",
        lastName: data.lastName,
        email: data.email.trim().toLowerCase(),
        phoneNumber: data.phoneNumber,
        secondaryPhoneNumber: data.secondaryPhoneNumber,
        ssnLast4: data.ssnLast4 || "0000",
        hasLicense: data.hasLicense,
        licenseNumber: data.licenseNumber || "",
        birthDate: data.birthDate,
        sex: data.sex,
        password: hashedPassword,
        role: "user"
      });

      await newUser.save();

      return NextResponse.json({ 
        success: true, 
        message: 'User registered successfully!',
        user: {
          _id: newUser._id,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          photo: newUser.photo || null,
          type: 'student'
        }
      });
    } catch (saveError: unknown) {
      console.error('Error saving user:', saveError);
      const errorMessage = saveError instanceof Error ? saveError.message : 'Unknown error occurred';
      return NextResponse.json({ 
        error: 'Failed to create user account. Please try again.',
        details: errorMessage 
      }, { status: 500 });
    }
  }

  // Si NO viene código, solo enviar código de verificación (flujo original)
  // Validar campos mínimos para envío de código
  if (!data.email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  // Verifica si el email ya está registrado
  const exists = await User.findOne({ email: data.email });
  if (exists) {
    return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
  }

  // Genera y almacena el código
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await AuthCode.deleteMany({ email: data.email.trim().toLowerCase(), used: false });
  await AuthCode.create({
    email: data.email.trim().toLowerCase(),
    code,
    expires: new Date(Date.now() + 10 * 60 * 1000),
    used: false,
  });

  // Enviar correo (usa la plantilla del login)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const logoUrl = "https://res.cloudinary.com/dgnqk0ucm/image/upload/v1758091374/logo_1_iol4hm.png";
  const html = `
    <div style="background: #f6f8fa; padding: 0; min-height: 100vh;">
      <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden;">
        <div style="background: #2346a0; padding: 32px 0 24px 0; text-align: center;">
          <img src="${logoUrl}" alt="Logo" width="80" style="margin-bottom: 12px;" />
          <h1 style="color: #fff; font-size: 2rem; margin: 0; font-family: Arial, sans-serif; letter-spacing: 1px;">
            Driving School Notification
          </h1>
        </div>
        <div style="padding: 36px 32px 24px 32px; font-family: Arial, sans-serif; color: #222;">
          <h2 style="color: #0056b3; margin-top: 0;">Hello, <b>${data.firstName?.toUpperCase() || 'User'}</b>!</h2>
          <div style="font-size: 1.1rem; margin-bottom: 32px; line-height: 1.7; text-align: center;">
            <div style="font-size: 1.2rem; margin-bottom: 12px;">Your verification code is:</div>
            <div style="font-size: 2.5rem; font-weight: bold; color: #2346a0; background: #f0f6ff; border-radius: 12px; padding: 18px 0; letter-spacing: 8px; margin: 0 auto; max-width: 220px;">${code}</div>
            <div style="margin-top: 18px; color: #888; font-size: 1rem;">This code will expire in 10 minutes.</div>
          </div>
        </div>
        <div style="background: linear-gradient(135deg, #0056b3, #000); color: white; padding: 32px 24px; border-radius: 0 0 36px 36px; text-align: center;">
          <img src='${logoUrl}' alt='Logo' width='60' style='margin-bottom: 12px;' />
          <div style="font-size: 1.3rem; font-weight: bold; margin-bottom: 8px;">Affordable Driving<br/>Traffic School</div>
          <div style="margin-bottom: 8px; font-size: 1rem;">
            West Palm Beach, FL | <a href="mailto:info@drivingschoolpalmbeach.com" style="color: #fff; text-decoration: underline;">info@drivingschoolpalmbeach.com</a> | 561 330 7007
          </div>
          <div style="font-size: 12px; color: #ccc;">&copy; ${new Date().getFullYear()} Powered By Botopia Technology S.A.S</div>
        </div>
      </div>
    </div>
  `;
  await transporter.sendMail({
    from: 'info@drivingschoolpalmbeach.com',
    to: data.email,
    subject: 'Your Verification Code',
    html,
  });
  return NextResponse.json({ success: true, message: 'Verification code sent to email.' });
}

// Handler para obtener usuario por ID usando query param (?id=123)
export const GET = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    if (!userId) {
      return NextResponse.json({ error: 'Missing id query param' }, { status: 400 });
    }
    let user = mongoose.Types.ObjectId.isValid(userId)
      ? await User.findById(userId).lean()
      : null;
    if (!user) {
      user = await User.findOne({ authId: userId }).lean();
    }
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error al buscar usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
};

// Handler para actualizar usuario por ID usando query param (?id=123)
export const PUT = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    if (!userId) {
      return NextResponse.json({ error: 'Missing id query param' }, { status: 400 });
    }
    const { note } = await req.json();
    const user = await User.findByIdAndUpdate(
      userId,
      { privateNotes: note },
      { new: true }
    ).lean();
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}; 