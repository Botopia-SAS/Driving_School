import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

async function cleanupPhone() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }

    // Eliminar campos obsoletos (formattedNumber y displayNumber)
    const result = await db.collection("phones").updateOne(
      { key: "main" },
      {
        $unset: {
          formattedNumber: "",
          displayNumber: ""
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log("✅ Cleaned up old phone fields");
    } else {
      console.log("ℹ️  No cleanup needed - phone document is already clean");
    }

    // Mostrar el documento actualizado
    const phone = await db.collection("phones").findOne({ key: "main" });
    console.log("\n📞 Current phone document:");
    console.log(JSON.stringify(phone, null, 2));

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error cleaning up phone:", error);
    process.exit(1);
  }
}

cleanupPhone();
