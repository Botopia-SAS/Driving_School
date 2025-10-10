import mongoose from "mongoose";
import Phone from "../models/Phone";

const MONGODB_URI = process.env.MONGODB_URI || "";

async function seedPhone() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Verificar si ya existe el número principal
    const existingPhone = await Phone.findOne({ key: "main" });

    if (existingPhone) {
      console.log("📞 Phone number already exists:");
      console.log(`   Phone: ${existingPhone.phoneNumber}`);
    } else {
      // Crear el número de teléfono principal
      const phone = await Phone.create({
        key: "main",
        phoneNumber: "(561) 969-0150",
      });

      console.log("✅ Phone number created successfully:");
      console.log(`   Phone: ${phone.phoneNumber}`);
    }

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error seeding phone:", error);
    process.exit(1);
  }
}

seedPhone();
