import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Contact from "@/models/Contact";
import nodemailer from "nodemailer";
import { generateContactEmailTemplate } from "@/lib/emailTemplate";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    // Upload images to Cloudinary if provided
    const uploadedImageUrls: string[] = [];
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      for (const base64Image of data.images) {
        try {
          const uploadResult = await cloudinary.uploader.upload(base64Image, {
            folder: "contact_form",
            resource_type: "image",
          });
          uploadedImageUrls.push(uploadResult.secure_url);
        } catch (uploadError) {
          console.error("Error uploading image to Cloudinary:", uploadError);
        }
      }
    }

    // Save contact to database with Cloudinary URLs
    const contactData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      subject: data.subject,
      inquiry: data.inquiry,
      images: uploadedImageUrls,
    };
    const newContact = await Contact.create(contactData);

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Generate email HTML template
    const emailHtml = generateContactEmailTemplate({
      name: data.name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      subject: data.subject,
      inquiry: data.inquiry,
      images: uploadedImageUrls,
    });

    // Send email to school
    await transporter.sendMail({
      from: `"Affordable Driving Traffic School" <${process.env.SMTP_USER}>`,
      to: "andreyplazas77@gmail.com",
      subject: `New Contact Form: ${data.subject} - ${data.name}`,
      html: emailHtml,
    });

    // Delete the contact document after successfully sending the email
    await Contact.findByIdAndDelete(newContact._id);
    console.log("✅ Contact document deleted after sending email successfully");

    return NextResponse.json(
      {
        message: "Contact form submitted successfully! We'll get back to you soon.",
        contactId: newContact._id.toString() // Return only the ID for reference
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error processing contact form:", error);
    return NextResponse.json(
      { error: "There was a problem submitting your contact form. Please try again." },
      { status: 500 }
    );
  }
}
